import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { LoggerService } from '../common/logger.service';
import { Retry } from '../common/retry.decorator';
import { University, UniversityRawData } from './university.types';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UniversityService {
  private readonly defaultApiUrl = 'http://universities.hipolabs.com/search';
  private readonly defaultCountry = 'United+States';
  private readonly defaultLimit = 500;
  private readonly dataFilePath = './data/universities.json';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  @Retry(3, 1000)
  async fetchUniversitiesPage(offset: number, limit: number): Promise<UniversityRawData[]> {
    const country = this.configService.get<string>('DEFAULT_COUNTRY', this.defaultCountry);
    const apiUrl = `${this.defaultApiUrl}?offset=${offset}&limit=${limit}&country=${country}`;

    this.logger.log(`Fetching universities page: offset=${offset}, limit=${limit}`);

    const { data } = await firstValueFrom(this.httpService.get<UniversityRawData[]>(apiUrl));

    this.logger.log(`Fetched ${data.length} universities for page offset=${offset}`);
    return data;
  }

  async fetchAllUniversities(): Promise<UniversityRawData[]> {
    const limit = this.configService.get<number>('DEFAULT_LIMIT', this.defaultLimit);
    let offset = 0;
    let allUniversities: UniversityRawData[] = [];
    let hasMoreData = true;

    this.logger.log(`Starting incremental fetch with limit=${limit}`);

    while (hasMoreData) {
      const pageData = await this.fetchUniversitiesPage(offset, limit);

      if (pageData.length === 0) {
        hasMoreData = false;
        this.logger.log(`No more data found at offset=${offset}`);
      } else {
        allUniversities = [...allUniversities, ...pageData];
        offset += pageData.length;
        this.logger.log(`Total universities fetched so far: ${allUniversities.length}`);
      }
    }

    this.logger.log(`Completed fetching all universities. Total: ${allUniversities.length}`);
    return allUniversities;
  }

  transformUniversities(rawData: UniversityRawData[]): University[] {
    const universitiesMap = new Map<string, University>();

    rawData.forEach(raw => {
      const key = `${raw.name}:${raw.alpha_two_code}`;
      if (!universitiesMap.has(key)) {
        universitiesMap.set(key, {
          name: raw.name,
          country: raw.country,
          alphaTwoCode: raw.alpha_two_code,
          domains: raw.domains || [],
          webPages: raw.web_pages || [],
          stateProvince: raw['state-province'],
        });
      }
    });

    return Array.from(universitiesMap.values());
  }

  async loadUniversities(transformedData: University[]): Promise<void> {
    const filePath = this.configService.get<string>('DATA_FILE_PATH', this.dataFilePath);
    this.logger.log(`Loading universities to ${filePath}`);

    let existingData: University[] = [];
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      existingData = JSON.parse(fileContent);
    } catch (error) {
      this.logger.warn(`No existing data file found at ${filePath}`);
    }

    const universitiesMap = new Map<string, University>();

    [...existingData, ...transformedData].forEach(uni => {
      const key = `${uni.name}:${uni.alphaTwoCode}`;
      universitiesMap.set(key, uni);
    });

    const mergedData = Array.from(universitiesMap.values());
    await fs.writeFile(filePath, JSON.stringify(mergedData, null, 2));

    this.logger.log(`Successfully loaded ${mergedData.length} universities`);
  }

  async runEtl(): Promise<void> {
    try {
      const rawData = await this.fetchAllUniversities();
      const transformedData = this.transformUniversities(rawData);
      await this.loadUniversities(transformedData);
    } catch (error) {
      this.logger.error('ETL process failed', error.stack);
      throw error;
    }
  }

  async getUniversities(offset = 0, limit?: number): Promise<University[]> {
    const filePath = this.configService.get<string>('DATA_FILE_PATH', this.dataFilePath);
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const allUniversities = JSON.parse(fileContent);

      // Apply pagination if limit is provided
      if (limit !== undefined) {
        return allUniversities.slice(offset, offset + limit);
      }

      // If no limit provided, return all universities from offset
      return allUniversities.slice(offset);
    } catch (error) {
      this.logger.error('Failed to read universities file', error.stack);
      return [];
    }
  }
}
