import { Menu } from '@prisma/client';

export class MenuResponseDto<T = Menu | Menu[]> {
	success: boolean;
	message: string;
	data?: T;
	error?: string;

	static success<T = Menu | Menu[]>(
		data: T,
		message = 'Operation successful',
	): MenuResponseDto<T> {
		return {
			success: true,
			message,
			data,
		};
	}

	static error(
		error: string,
		message = 'Operation failed',
	): MenuResponseDto<never> {
		return {
			success: false,
			message,
			error,
		};
	}
}
