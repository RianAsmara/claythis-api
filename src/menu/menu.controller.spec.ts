import { Test, TestingModule } from '@nestjs/testing';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { MenuResponseDto } from './dto/menu.response.dto';
import { Menu } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { MenuDepthException } from './exceptions/menu-depth.exception';

describe('MenuController', () => {
	let controller: MenuController;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let service: MenuService;

	const mockMenu = {
		id: '1',
		name: 'Test Menu',
		path: 'test',
		depth: 0,
		parentId: null,
		isPublished: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	} as Menu;

	const mockMenuService = {
		findAll: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [MenuController],
			providers: [
				{
					provide: MenuService,
					useValue: mockMenuService,
				},
			],
		}).compile();

		controller = module.get<MenuController>(MenuController);
		service = module.get<MenuService>(MenuService);

		// Clear all mocks before each test
		jest.clearAllMocks();
	});

	describe('findAll', () => {
		it('should return success response with menus', async () => {
			const menus = [mockMenu];
			mockMenuService.findAll.mockResolvedValue(menus);

			const result = await controller.findAll();
			expect(result).toEqual(
				MenuResponseDto.success(menus, 'Menus retrieved successfully'),
			);
		});

		it('should handle errors', async () => {
			const error = new Error('Database error');
			mockMenuService.findAll.mockRejectedValue(error);

			const result = await controller.findAll();
			expect(result).toEqual(
				MenuResponseDto.error(error.message, 'Failed to get menus'),
			);
		});
	});

	describe('create', () => {
		const createDto = {
			name: 'New Menu',
			path: 'new',
			depth: 0,
		};

		it('should return success response with created menu', async () => {
			const createdMenu = {
				...mockMenu,
				...createDto,
				id: '2',
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockMenuService.create.mockResolvedValue(createdMenu);

			const result = await controller.create(createDto);
			expect(result).toEqual(
				MenuResponseDto.success(
					createdMenu,
					'Menu created successfully',
				),
			);
		});

		it('should handle validation errors', async () => {
			const error = new MenuDepthException();
			mockMenuService.create.mockRejectedValue(error);

			const result = await controller.create(createDto);
			expect(result).toEqual(
				MenuResponseDto.error(error.message, 'Failed to create menu'),
			);
		});
	});

	describe('update', () => {
		const updateDto = {
			name: 'Updated Menu',
			path: 'updated',
			depth: 0,
		};

		it('should return success response with updated menu', async () => {
			const updatedMenu = {
				...mockMenu,
				...updateDto,
				id: '1',
				updatedAt: new Date(),
			};
			mockMenuService.update.mockResolvedValue(updatedMenu);

			const result = await controller.update('1', updateDto);
			expect(result).toEqual(
				MenuResponseDto.success(
					updatedMenu,
					'Menu updated successfully',
				),
			);
		});

		it('should handle not found error', async () => {
			const error = new NotFoundException('Menu not found');
			mockMenuService.update.mockRejectedValue(error);

			const result = await controller.update('999', updateDto);
			expect(result).toEqual(
				MenuResponseDto.error(error.message, 'Failed to update menu'),
			);
		});
	});

	describe('remove', () => {
		it('should return success response with deleted menu', async () => {
			const deletedMenu = {
				...mockMenu,
				id: '1',
				name: 'Deleted Menu',
				updatedAt: new Date(),
			};
			mockMenuService.remove.mockResolvedValue(deletedMenu);

			const result = await controller.remove('1');
			expect(result).toEqual(
				MenuResponseDto.success(
					deletedMenu,
					'Menu and its children deleted successfully',
				),
			);
		});

		it('should handle not found error', async () => {
			const error = new NotFoundException('Menu not found');
			mockMenuService.remove.mockRejectedValue(error);

			const result = await controller.remove('999');
			expect(result).toEqual(
				MenuResponseDto.error(error.message, 'Failed to delete menu'),
			);
		});
	});
});
