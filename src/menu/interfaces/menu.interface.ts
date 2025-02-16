import { Menu as PrismaMenu } from '@prisma/client';

export interface MenuWithChildren extends PrismaMenu {
	children?: MenuWithChildren[];
}
