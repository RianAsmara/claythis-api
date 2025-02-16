import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MenuModule } from './menu/menu.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
	imports: [MenuModule, PrismaModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
