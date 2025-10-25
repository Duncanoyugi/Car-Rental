import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseTestService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseTestService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.testConnection();
  }

  async testConnection(): Promise<void> {
    try {
      // Check if connection is initialized
      if (this.dataSource.isInitialized) {
        this.logger.log('✅ Database connection is initialized');
        
        // Test the connection by running a simple query
        const result = await this.dataSource.query('SELECT 1 AS test');
        
        if (result) {
          this.logger.log('✅ Database connection test SUCCESSFUL');
          this.logger.log(`📊 Connected to database: ${this.dataSource.options.database}`);
          this.logger.log(`🖥️  Server: ${(this.dataSource.options as any).host}:${(this.dataSource.options as any).port}`);
          this.logger.log(`👤 Username: ${(this.dataSource.options as any).username}`);
          this.logger.log(`📂 Schema: ${(this.dataSource.options as any).schema}`);
          
          
        }
      } else {
        this.logger.error('❌ Database connection is NOT initialized');
      }
    } catch (error) {
      this.logger.error('❌ Database connection test FAILED');
      this.logger.error(`Error: ${error.message}`);
      this.logger.error('Stack trace:', error.stack);
      
      // Provide helpful debugging information
      this.logger.error('🔍 Debugging tips:');
      this.logger.error('1. Check if SQL Server is running');
      this.logger.error('2. Verify credentials in .env file');
      this.logger.error('3. Check if the database exists');
      this.logger.error('4. Verify network connectivity and firewall settings');
      this.logger.error('5. Ensure SQL Server is configured to accept TCP/IP connections');
    }
  }

  

  // Method to manually test connection (can be called from a controller)
  async getConnectionStatus(): Promise<{
    isConnected: boolean;
    database: string;
    host: string;
    port: number;
    message: string;
  }> {
    try {
      const isConnected = this.dataSource.isInitialized;
      const options = this.dataSource.options as any;
      
      if (isConnected) {
        await this.dataSource.query('SELECT 1');
        return {
          isConnected: true,
          database: options.database,
          host: options.host,
          port: options.port,
          message: 'Database connection is active and working',
        };
      } else {
        return {
          isConnected: false,
          database: options.database,
          host: options.host,
          port: options.port,
          message: 'Database connection is not initialized',
        };
      }
    } catch (error) {
      return {
        isConnected: false,
        database: '',
        host: '',
        port: 0,
        message: `Connection failed: ${error.message}`,
      };
    }
  }
}