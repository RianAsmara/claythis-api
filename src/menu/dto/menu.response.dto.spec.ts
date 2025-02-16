import { MenuResponseDto } from './menu.response.dto';
import { Menu } from '@prisma/client';

describe('MenuResponseDto', () => {
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

	describe('success', () => {
		it('should create success response with default message', () => {
			const response = MenuResponseDto.success(mockMenu);
			expect(response).toEqual({
				success: true,
				message: 'Operation successful',
				data: mockMenu,
			});
		});

		it('should create success response with custom message', () => {
			const message = 'Custom success message';
			const response = MenuResponseDto.success(mockMenu, message);
			expect(response).toEqual({
				success: true,
				message,
				data: mockMenu,
			});
		});

		it('should handle array data', () => {
			const menus = [
				mockMenu,
				{
					...mockMenu,
					id: '2',
					name: 'Test Menu 2',
					path: 'test-2',
					updatedAt: new Date(),
				},
			];
			const response = MenuResponseDto.success(menus);
			expect(response).toEqual({
				success: true,
				message: 'Operation successful',
				data: menus,
			});
		});
	});

	describe('error', () => {
		it('should create error response with default message', () => {
			const error = 'Something went wrong';
			const response = MenuResponseDto.error(error);
			expect(response).toEqual({
				success: false,
				message: 'Operation failed',
				error,
			});
		});

		it('should create error response with custom message', () => {
			const error = 'Database error';
			const message = 'Custom error message';
			const response = MenuResponseDto.error(error, message);
			expect(response).toEqual({
				success: false,
				message,
				error,
			});
		});
	});
});
