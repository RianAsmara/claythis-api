import { Injectable, NotFoundException } from '@nestjs/common';
import { Menu, Prisma } from '@prisma/client';
import { CreateMenuDto } from './dto/create-menu.dto';
import { MenuDepthException } from './exceptions/menu-depth.exception';
import { MenuWithChildren } from './interfaces/menu.interface';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenuService {
	private readonly MAX_DEPTH = 3;

	constructor(private readonly prisma: PrismaService) {}

	async create(body: CreateMenuDto): Promise<Menu> {
		const parent = body.parentId
			? await this.findMenuById(body.parentId)
			: null;

		if (body.parentId && !parent) {
			throw new NotFoundException(
				`Parent menu with id ${body.parentId} not found`,
			);
		}

		if (parent && parent.depth === this.MAX_DEPTH) {
			throw new MenuDepthException();
		}

		return this.prisma.menu.create({
			data: {
				name: body.name,
				parentId: parent?.id,
				depth: parent ? parent.depth + 1 : 0,
				path: this.buildPath(parent?.path, body.path),
			},
		});
	}

	async findAll(): Promise<MenuWithChildren[]> {
		return this.prisma.menu.findMany({
			where: {
				depth: 0,
				isPublished: true,
			},
			include: this.getMenuIncludeQuery(),
		});
	}

	async update(id: string, body: UpdateMenuDto): Promise<MenuWithChildren> {
		const menu = await this.findMenuWithChildren(id);

		if (!menu) {
			throw new NotFoundException(`Menu with id ${id} not found`);
		}

		return this.prisma.$transaction(
			async (tx: Prisma.TransactionClient) => {
				const updatedMenu = (await tx.menu.update({
					where: { id },
					data: {
						name: body.name ?? menu.name,
						path: body.path
							? this.buildPath(null, body.path)
							: menu.path,
						isPublished: body.isPublished ?? menu.isPublished,
					},
					include: this.getMenuIncludeQuery(),
				})) as MenuWithChildren;

				if (body.path && menu.children) {
					await this.updateChildrenPaths(
						menu.children,
						updatedMenu.path,
						updatedMenu.isPublished,
						tx,
					);
				}

				return updatedMenu;
			},
		);
	}

	async remove(id: string): Promise<Menu> {
		const menu = await this.findMenuById(id, { children: true });

		if (!menu) {
			throw new NotFoundException(`Menu with id ${id} not found`);
		}

		return this.prisma.$transaction(
			async (tx: Prisma.TransactionClient) => {
				await this.deleteDescendants(id, tx);
				return tx.menu.delete({ where: { id } });
			},
		);
	}

	private async deleteDescendants(
		parentId: string,
		tx: Prisma.TransactionClient,
	) {
		const children = await tx.menu.findMany({
			where: { parentId },
			select: { id: true },
		});

		for (const child of children) {
			await this.deleteDescendants(child.id, tx);
			await tx.menu.delete({ where: { id: child.id } });
		}
	}

	private async updateChildrenPaths(
		children: MenuWithChildren[],
		parentPath: string,
		isPublished: boolean,
		tx: Prisma.TransactionClient,
	) {
		for (const child of children) {
			const childPath = this.buildPath(
				parentPath,
				child.path.split('/').pop() || '',
			);

			await tx.menu.update({
				where: { id: child.id },
				data: {
					path: childPath,
					isPublished: isPublished ?? child.isPublished,
				},
			});

			if (child.children) {
				await this.updateChildrenPaths(
					child.children,
					childPath,
					isPublished,
					tx,
				);
			}
		}
	}

	private async findMenuById(
		id: string,
		include?: Prisma.MenuInclude,
	): Promise<Menu | null> {
		return this.prisma.menu.findUnique({
			where: { id },
			include,
		});
	}

	private async findMenuWithChildren(
		id: string,
	): Promise<MenuWithChildren | null> {
		return this.prisma.menu.findUnique({
			where: { id },
			include: this.getMenuIncludeQuery(),
		}) as Promise<MenuWithChildren | null>;
	}

	private getMenuIncludeQuery() {
		return {
			children: {
				include: {
					children: {
						include: {
							children: true,
						},
					},
				},
			},
		};
	}

	private buildPath(
		parentPath: string | null | undefined,
		path: string,
	): string {
		return parentPath
			? `${parentPath}/${String(path).toLowerCase()}`
			: String(path).toLowerCase();
	}
}
