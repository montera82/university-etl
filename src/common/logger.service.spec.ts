import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from './logger.service';
import * as winston from 'winston';

describe('LoggerService', () => {
  let service: LoggerService;
  let mockLogger: jest.Mocked<winston.Logger>;

  beforeEach(async () => {
    // Create a mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;

    // Mock the winston.createLogger function
    jest.spyOn(winston, 'createLogger').mockReturnValue(mockLogger);

    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggerService],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should call logger.info with message and context', () => {
      const message = 'Test message';
      const context = 'TestContext';

      service.log(message, context);

      expect(mockLogger.info).toHaveBeenCalledWith(message, { context });
    });

    it('should call logger.info with message only when context is not provided', () => {
      const message = 'Test message';

      service.log(message);

      expect(mockLogger.info).toHaveBeenCalledWith(message, { context: undefined });
    });
  });

  describe('error', () => {
    it('should call logger.error with message, trace and context', () => {
      const message = 'Error message';
      const trace = 'Error trace';
      const context = 'ErrorContext';

      service.error(message, trace, context);

      expect(mockLogger.error).toHaveBeenCalledWith(message, { trace, context });
    });

    it('should call logger.error with message only when trace and context are not provided', () => {
      const message = 'Error message';

      service.error(message);

      expect(mockLogger.error).toHaveBeenCalledWith(message, {
        trace: undefined,
        context: undefined,
      });
    });
  });

  describe('warn', () => {
    it('should call logger.warn with message and context', () => {
      const message = 'Warning message';
      const context = 'WarningContext';

      service.warn(message, context);

      expect(mockLogger.warn).toHaveBeenCalledWith(message, { context });
    });

    it('should call logger.warn with message only when context is not provided', () => {
      const message = 'Warning message';

      service.warn(message);

      expect(mockLogger.warn).toHaveBeenCalledWith(message, { context: undefined });
    });
  });

  describe('debug', () => {
    it('should call logger.debug with message and context', () => {
      const message = 'Debug message';
      const context = 'DebugContext';

      service.debug(message, context);

      expect(mockLogger.debug).toHaveBeenCalledWith(message, { context });
    });

    it('should call logger.debug with message only when context is not provided', () => {
      const message = 'Debug message';

      service.debug(message);

      expect(mockLogger.debug).toHaveBeenCalledWith(message, { context: undefined });
    });
  });

  describe('verbose', () => {
    it('should call logger.verbose with message and context', () => {
      const message = 'Verbose message';
      const context = 'VerboseContext';

      service.verbose(message, context);

      expect(mockLogger.verbose).toHaveBeenCalledWith(message, { context });
    });

    it('should call logger.verbose with message only when context is not provided', () => {
      const message = 'Verbose message';

      service.verbose(message);

      expect(mockLogger.verbose).toHaveBeenCalledWith(message, { context: undefined });
    });
  });
});
