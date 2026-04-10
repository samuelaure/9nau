import { AllExceptionsFilter } from './all-exceptions.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockHttpAdapter: {
    getRequestUrl: jest.Mock;
    reply: jest.Mock;
  };

  beforeEach(() => {
    mockHttpAdapter = {
      getRequestUrl: jest.fn().mockReturnValue('/test'),
      reply: jest.fn(),
    };
    const adapterHost = {
      httpAdapter: mockHttpAdapter,
    } as HttpAdapterHost;
    filter = new AllExceptionsFilter(adapterHost);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should catch HttpException and return correct response', () => {
    const mockCtx = {
      getResponse: jest.fn().mockReturnValue({}),
      getRequest: jest.fn().mockReturnValue({}),
    };
    const mockHost = {
      switchToHttp: () => mockCtx,
    } as ArgumentsHost;

    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost);

    expect(mockHttpAdapter.reply).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Test error',
        path: '/test',
      }),
      HttpStatus.BAD_REQUEST,
    );
  });
});
