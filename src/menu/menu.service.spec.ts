import { Test, TestingModule } from '@nestjs/testing';
import { MenuService } from './menu.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { MenuDepthException } from './exceptions/menu-depth.exception';
import { Menu } from '@prisma/client';
import { MenuWithChildren } from './interfaces/menu.interface';

describe('MenuService', () => {
	let service: MenuService;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let prismaService: PrismaService;

	const mockMenu = {
		id: '1',
		name: 'Menu 1',
		depth: 1,
		parentId: null,
		path: '1',
		children: [],
	} as MenuWithChildren;

	// Create mock methods
	const mockMenuMethods = {
		findMany: jest.fn(),
		findUnique: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	};

	const mockPrisma = {
		menu: mockMenuMethods,
		$transaction: jest.fn().mockImplementation((callback) => {
			if (typeof callback === 'function') {
				return callback({ menu: mockMenuMethods });
			}
			return Promise.resolve(callback);
		}),
	} as unknown as PrismaService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MenuService,
				{
					provide: PrismaService,
					useValue: mockPrisma,
				},
			],
		}).compile();

		service = module.get<MenuService>(MenuService);
		prismaService = module.get<PrismaService>(PrismaService);

		// Clear all mocks before each test
		jest.clearAllMocks();
	});

	describe('findAll', () => {
		it('should return an array of menus', async () => {
			const expectedMenus = [{ id: '1', name: 'Menu 1' }] as Menu[];
			(mockPrisma.menu.findMany as jest.Mock).mockResolvedValue(
				expectedMenus,
			);

			const result = await service.findAll();
			expect(result).toEqual(expectedMenus);
			expect(mockPrisma.menu.findMany).toHaveBeenCalled();
		});
	});

	describe('create', () => {
		const createDto = { name: 'New Menu', depth: 1, path: '1' };

		it('should create a menu without parent', async () => {
			const expectedMenu = { id: '1', ...createDto } as Menu;
			(mockPrisma.menu.create as jest.Mock).mockResolvedValue(
				expectedMenu,
			);

			const result = await service.create(createDto);
			expect(result).toEqual(expectedMenu);
			expect(mockPrisma.menu.create).toHaveBeenCalledWith({
				data: {
					name: createDto.name,
					parentId: undefined,
					depth: 0,
					path: createDto.path.toLowerCase(),
				},
			});
		});

		it('should create a menu with parent', async () => {
			const parentMenu = {
				id: 'parent-1',
				name: 'Parent Menu',
				depth: 1,
				path: 'parent',
			} as Menu;

			const createDtoWithParent = {
				...createDto,
				parentId: parentMenu.id,
			};

			(mockPrisma.menu.findUnique as jest.Mock).mockResolvedValue(
				parentMenu,
			);
			(mockPrisma.menu.create as jest.Mock).mockResolvedValue({
				id: '2',
				...createDtoWithParent,
				depth: parentMenu.depth + 1,
				path: `${parentMenu.path}/${createDto.path.toLowerCase()}`,
			} as Menu);

			const result = await service.create(createDtoWithParent);
			expect(mockPrisma.menu.create).toHaveBeenCalledWith({
				data: {
					name: createDto.name,
					parentId: parentMenu.id,
					depth: parentMenu.depth + 1,
					path: `${parentMenu.path}/${createDto.path.toLowerCase()}`,
				},
			});
			expect(result).toBeDefined();
		});

		it('should throw if parent not found', async () => {
			const dtoWithParent = { ...createDto, parentId: '999' };
			(mockPrisma.menu.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(service.create(dtoWithParent)).rejects.toThrow(
				NotFoundException,
			);
		});

		it('should throw if parent depth is 3', async () => {
			const dtoWithParent = { ...createDto, parentId: '1' };
			(mockPrisma.menu.findUnique as jest.Mock).mockResolvedValue({
				id: '1',
				depth: 3,
			} as Menu);

			await expect(service.create(dtoWithParent)).rejects.toThrow(
				MenuDepthException,
			);
		});
	});

	describe('update', () => {
		it('should update a menu', async () => {
			const id = '1';
			const updateDto = {
				name: 'Updated Menu',
				path: 'updated',
				depth: 1,
			};
			const existingMenu = {
				...mockMenu,
				children: [],
			};
			const updatedMenu = {
				...existingMenu,
				...updateDto,
				path: updateDto.path.toLowerCase(),
			};

			(mockPrisma.menu.findUnique as jest.Mock).mockResolvedValue(
				existingMenu,
			);
			(mockMenuMethods.update as jest.Mock).mockResolvedValue(
				updatedMenu,
			);

			const result = await service.update(id, updateDto);
			expect(result).toEqual(updatedMenu);
			expect(mockMenuMethods.update).toHaveBeenCalledWith({
				where: { id },
				data: {
					name: updateDto.name,
					path: updateDto.path.toLowerCase(),
				},
				include: {
					children: {
						include: {
							children: {
								include: {
									children: true,
								},
							},
						},
					},
				},
			});
		});

		it('should throw if menu not found', async () => {
			const id = '999';
			(mockPrisma.menu.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(
				service.update(id, {
					name: 'Updated',
					path: 'updated',
					depth: 1,
				}),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('remove', () => {
		it('should remove a menu', async () => {
			const id = '1';
			const menuToDelete = {
				id,
				name: 'Menu to Delete',
				children: [],
			} as MenuWithChildren;

			const expectedMenu = { id, name: 'Deleted Menu' } as Menu;

			// Mock findUnique to return the menu
			(mockPrisma.menu.findUnique as jest.Mock).mockResolvedValue(
				menuToDelete,
			);

			// Mock the delete operation in transaction
			(mockMenuMethods.delete as jest.Mock).mockResolvedValue(
				expectedMenu,
			);

			// Mock findMany for deleteDescendants (no children)
			(mockMenuMethods.findMany as jest.Mock).mockResolvedValue([]);

			const result = await service.remove(id);
			expect(result).toEqual(expectedMenu);
			expect(mockMenuMethods.delete).toHaveBeenCalledWith({
				where: { id },
			});
		});

		it('should throw if menu not found', async () => {
			const id = '999';
			(mockPrisma.menu.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(service.remove(id)).rejects.toThrow(NotFoundException);
		});

		it('should delete menu with children', async () => {
			const id = '1';
			const child1Id = '2';
			const child2Id = '3';

			const menuToDelete = {
				id,
				name: 'Parent Menu',
				children: [{ id: child1Id }, { id: child2Id }],
			} as MenuWithChildren;

			const expectedMenu = { id, name: 'Deleted Menu' } as Menu;

			// Mock findUnique to return the menu with children
			(mockPrisma.menu.findUnique as jest.Mock).mockResolvedValue(
				menuToDelete,
			);

			// Mock findMany to return children for first call, then empty for subsequent calls
			(mockMenuMethods.findMany as jest.Mock)
				.mockResolvedValueOnce([{ id: child1Id }, { id: child2Id }])
				.mockResolvedValue([]);

			// Mock the delete operations
			(mockMenuMethods.delete as jest.Mock).mockResolvedValue(
				expectedMenu,
			);

			const result = await service.remove(id);
			expect(result).toEqual(expectedMenu);

			// Verify children were deleted first
			expect(mockMenuMethods.delete).toHaveBeenCalledWith({
				where: { id: child1Id },
			});
			expect(mockMenuMethods.delete).toHaveBeenCalledWith({
				where: { id: child2Id },
			});

			// Verify parent was deleted last
			expect(mockMenuMethods.delete).toHaveBeenLastCalledWith({
				where: { id },
			});
		});
	});
});
