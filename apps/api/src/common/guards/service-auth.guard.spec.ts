import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ServiceAuthGuard } from './service-auth.guard';

describe('ServiceAuthGuard', () => {
  let guard: ServiceAuthGuard;

  beforeEach(() => {
    guard = new ServiceAuthGuard();
    process.env.NAU_SERVICE_KEY = 'secret';
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access with correct x-nau-service-key header', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-nau-service-key': 'secret' },
        }),
      }),
    } as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access with correct Bearer token', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer secret' },
        }),
      }),
    } as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw UnauthorizedException with incorrect key', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-nau-service-key': 'wrong' },
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
