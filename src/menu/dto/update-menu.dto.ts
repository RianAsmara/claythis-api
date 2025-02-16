import {
	IsBoolean,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
} from 'class-validator';

export class UpdateMenuDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsInt()
	@IsOptional()
	@IsNotEmpty()
	depth: number;

	@IsOptional()
	@IsString()
	@IsNotEmpty()
	parentId?: string;

	@IsString()
	@IsNotEmpty()
	path: string;

	@IsOptional()
	@IsBoolean()
	@IsNotEmpty()
	isPublished?: boolean;
}
