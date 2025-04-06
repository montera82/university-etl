import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UniversityController } from './university.controller';
import { UniversityService } from './university.service';
import { LoggerService } from '../common/logger.service';

@Module({
  imports: [HttpModule],
  controllers: [UniversityController],
  providers: [UniversityService, LoggerService],
})
export class UniversityModule {}
