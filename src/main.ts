import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// set global prefix
	app.setGlobalPrefix('api');

	// enable cors
	app.enableCors();

	app.enableVersioning({
		defaultVersion: ['1'],
		type: VersioningType.URI,
	});

	// use global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
		}),
	);

	console.log(process.env.APP_NAME);
	console.log(process.env.PORT);
	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
