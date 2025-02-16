import { BadRequestException } from '@nestjs/common';

export class MenuDepthException extends BadRequestException {
	constructor(message = 'Menu depth limit reached (max: 3 levels)') {
		super(message);
	}
}
