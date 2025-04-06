import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../common/logger.service';
import { UniversityService } from './university.service';
import { University, UniversityRawData } from './university.types';
import { of } from 'rxjs';

jest.mock('fs/promises');

describe('UniversityService', () => {
  let service: UniversityService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockUniversityRawData: UniversityRawData[] = [
    {
      name: 'Test University',
      country: 'United States',
      alpha_two_code: 'US',
      domains: ['test.edu'],
      web_pages: ['https://test.edu'],
      'state-province': 'California',
    },
  ];

  const mockTransformedUniversities: University[] = [
    {
      name: 'Test University',
      country: 'United States',
      alphaTwoCode: 'US',
      domains: ['test.edu'],
      webPages: ['https://test.edu'],
      stateProvince: 'California',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniversityService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<UniversityService>(UniversityService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchUniversitiesPage', () => {
    it('should fetch universities page with default country', async () => {
      // Arrange
      const offset = 0;
      const limit = 10;
      const expectedUrl =
        'http://universities.hipolabs.com/search?offset=0&limit=10&country=United+States';

      mockConfigService.get.mockReturnValue('United+States');
      mockHttpService.get.mockReturnValue(of({ data: mockUniversityRawData }));

      // Act
      const result = await service.fetchUniversitiesPage(offset, limit);

      // Assert
      expect(mockHttpService.get).toHaveBeenCalledWith(expectedUrl);
      expect(result).toEqual(mockUniversityRawData);
      expect(mockLoggerService.log).toHaveBeenCalledTimes(2);
    });

    it('should fetch universities page with custom country from config', async () => {
      // Arrange
      const offset = 0;
      const limit = 10;
      const customCountry = 'Canada';
      const expectedUrl =
        'http://universities.hipolabs.com/search?offset=0&limit=10&country=Canada';

      mockConfigService.get.mockReturnValue(customCountry);
      mockHttpService.get.mockReturnValue(of({ data: mockUniversityRawData }));

      // Act
      const result = await service.fetchUniversitiesPage(offset, limit);

      // Assert
      expect(mockHttpService.get).toHaveBeenCalledWith(expectedUrl);
      expect(result).toEqual(mockUniversityRawData);
    });
  });

  describe('fetchAllUniversities', () => {
    beforeEach(() => {
      // Reset mocks before each test
      mockConfigService.get.mockReset();
      mockHttpService.get.mockReset();
    });

    it('should fetch all universities with default limit', async () => {
      // Arrange
      const defaultLimit = 500;
      mockConfigService.get.mockReturnValue(defaultLimit);
      mockHttpService.get
        .mockReturnValueOnce(of({ data: mockUniversityRawData }))
        .mockReturnValueOnce(of({ data: [] }));

      // Act
      const result = await service.fetchAllUniversities();

      // Assert
      expect(mockHttpService.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockUniversityRawData);
    });

    it('should fetch all universities with custom limit from config', async () => {
      // Arrange
      const customLimit = 100;
      mockConfigService.get.mockReturnValue(customLimit);
      mockHttpService.get
        .mockReturnValueOnce(of({ data: mockUniversityRawData }))
        .mockReturnValueOnce(of({ data: [] }));

      // Act
      const result = await service.fetchAllUniversities();

      // Assert
      expect(mockHttpService.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockUniversityRawData);
    });

    it('should handle empty response and stop fetching', async () => {
      // Arrange
      const defaultLimit = 500;
      mockConfigService.get.mockReturnValue(defaultLimit);
      mockHttpService.get.mockReturnValueOnce(of({ data: [] }));

      // Act
      const result = await service.fetchAllUniversities();

      // Assert
      expect(mockHttpService.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });

  describe('transformUniversities', () => {
    it('should transform raw university data to University objects', () => {
      const rawData = mockUniversityRawData;
      const result = service.transformUniversities(rawData);

      expect(result).toEqual(mockTransformedUniversities);
    });

    it('should handle duplicate universities by name and country code', () => {
      const duplicateData = [
        ...mockUniversityRawData,
        {
          name: 'Test University',
          country: 'United States',
          alpha_two_code: 'US',
          domains: ['test.edu'],
          web_pages: ['https://test.edu'],
          'state-province': 'California',
        },
      ];

      const result = service.transformUniversities(duplicateData);

      expect(result.length).toBe(1);
      expect(result).toEqual(mockTransformedUniversities);
    });
  });
});
