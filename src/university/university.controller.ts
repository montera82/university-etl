import { Controller, Get, Res, Logger, Query } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { Cron } from '@nestjs/schedule';
import { UniversityService } from './university.service';
import * as csv from 'fast-csv';
import { University } from './university.types';

@Controller({ path: 'universities', version: '1' })
export class UniversityController {
  private readonly logger = new Logger(UniversityController.name);

  constructor(private readonly universityService: UniversityService) {}

  @Get('download')
  async downloadUniversities(
    @Res() res: FastifyReply,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string
  ) {
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    
    this.logger.log(`Downloading universities with offset=${parsedOffset}, limit=${parsedLimit}`);
    
    const universities = await this.universityService.getUniversities(parsedOffset, parsedLimit);
    
    res.header('Content-Type', 'text/csv');
    res.header(
      'Content-Disposition',
      'attachment; filename="universities.csv"',
    );

    const csvStream = csv.format({ headers: true });
    csvStream.pipe(res.raw);

    const headers = [
      'name',
      'country',
      'alphaTwoCode',
      'domains',
      'webPages',
      'stateProvince',
    ];
    csvStream.write(headers);

    universities.forEach((uni: University) => {
      csvStream.write([
        uni.name,
        uni.country,
        uni.alphaTwoCode,
        uni.domains.join(';'),
        uni.webPages.join(';'),
        uni.stateProvince || '',
      ]);
    });

    csvStream.end();
  }

  @Cron('0 0 * * *', { timeZone: 'UTC' })
  async handleCron() {
    this.logger.log('Running scheduled ETL process');
    await this.universityService.runEtl();
  }
} 