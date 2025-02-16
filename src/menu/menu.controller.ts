import {
	Body,
	Controller,
	Delete,
	Get,
	HttpStatus,
	Param,
	Patch,
	Post,
	HttpCode,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { MenuResponseDto } from './dto/menu.response.dto';
import { Menu } from '@prisma/client';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Controller({ version: '1', path: 'menu' })
export class MenuController {
	constructor(private readonly menuService: MenuService) {}

	@Get()
	async findAll(): Promise<MenuResponseDto<Menu[]>> {
		try {
			const menus = await this.menuService.findAll();
			return MenuResponseDto.success(
				menus,
				'Menus retrieved successfully',
			);
		} catch (error) {
			return MenuResponseDto.error(error.message, 'Failed to get menus');
		}
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async create(@Body() body: CreateMenuDto): Promise<MenuResponseDto<Menu>> {
		try {
			const menu = await this.menuService.create(body);
			return MenuResponseDto.success(menu, 'Menu created successfully');
		} catch (error) {
			return MenuResponseDto.error(
				error.message,
				'Failed to create menu',
			);
		}
	}

	@Patch(':id')
	async update(
		@Param('id') id: string,
		@Body() body: UpdateMenuDto,
	): Promise<MenuResponseDto<Menu>> {
		try {
			const menu = await this.menuService.update(id, body);
			return MenuResponseDto.success(menu, 'Menu updated successfully');
		} catch (error) {
			return MenuResponseDto.error(
				error.message,
				'Failed to update menu',
			);
		}
	}

	@Delete(':id')
	async remove(@Param('id') id: string): Promise<MenuResponseDto<Menu>> {
		try {
			const menu = await this.menuService.remove(id);
			return MenuResponseDto.success(
				menu,
				'Menu and its children deleted successfully',
			);
		} catch (error) {
			return MenuResponseDto.error(
				error.message,
				'Failed to delete menu',
			);
		}
	}
}
