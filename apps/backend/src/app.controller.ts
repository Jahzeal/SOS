import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      message: 'VerifyFlow NestJS API is running successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  getHealthStatus() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
