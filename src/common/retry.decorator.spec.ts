import { Logger } from '@nestjs/common';
import { Retry } from './retry.decorator';

const mockWarn = jest.fn();

jest.mock('@nestjs/common', () => {
  return {
    Logger: jest.fn(() => ({
      warn: mockWarn,
    })),
  };
});

describe('Retry Decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  class TestClass {
    @Retry(3, 100)
    async successfulMethod(): Promise<string> {
      return 'success';
    }
  }

  it('should succeed on first attempt when no error occurs', async () => {
    const testInstance = new TestClass();
    const result = await testInstance.successfulMethod();
    
    expect(result).toBe('success');
    expect(mockWarn).not.toHaveBeenCalled();
  });
}); 