import { Controller, Get } from '@nestjs/common';
import { DatabaseTestService } from './database-test.service';

@Controller('health')
export class DatabaseHealthController {
  constructor(private readonly databaseTestService: DatabaseTestService) {}

  @Get('database')
  async checkDatabaseHealth() {
    const status = await this.databaseTestService.getConnectionStatus();
    
    return {
      timestamp: new Date().toISOString(),
      status: status.isConnected ? 'healthy' : 'unhealthy',
      details: status,
    };
  }
}