import { UniversityController } from './university.controller';
import { UniversityService } from './university.service';

describe('UniversityController', () => {
  let controller: UniversityController;

  // Create a properly typed mock service
  const mockUniversityService = {
    runEtl: jest.fn().mockImplementation(() => Promise.resolve()),
  } as unknown as UniversityService;

  // Manual setup instead of using TestingModule
  beforeEach(() => {
    controller = new UniversityController(mockUniversityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleCron', () => {
    it('should run ETL process', async () => {
      await controller.handleCron();
      expect(mockUniversityService.runEtl).toHaveBeenCalled();
    });

    it('should handle ETL process errors', async () => {
      const error = new Error('ETL failed');
      (mockUniversityService.runEtl as jest.Mock).mockRejectedValue(error);
      await expect(controller.handleCron()).rejects.toThrow('ETL failed');
    });
  });
});
