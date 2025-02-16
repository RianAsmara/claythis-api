import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

interface HealthCheckResponse {
	status: 'ok' | 'error';
}

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get('health')
	healthCheck(): HealthCheckResponse {
		return { status: 'ok' };
	}
}
