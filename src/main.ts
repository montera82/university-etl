import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './common/logger.service';
import { UniversityService } from './university/university.service';
import { VersioningType } from '@nestjs/common';

async function runEtlProcess(logger: LoggerService, universityService: UniversityService): Promise<void> {
  try {
    logger.log('Running initial ETL process');
    await universityService.runEtl();
  } catch (error) {
    logger.error('Initial ETL process failed', error.stack);
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);
  const universityService = app.get(UniversityService);

  const port = configService.getOrThrow<number>('PORT');
  
  // Simple boolean parsing with default value
  const runEtlOnStartup = configService.get('RUN_ETL_ON_STARTUP', 'true').toLowerCase() === 'true';
  
  if (runEtlOnStartup) {
    await runEtlProcess(logger, universityService);
  } else {
    logger.log('Skipping initial ETL process as RUN_ETL_ON_STARTUP is set to false');
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap(); 