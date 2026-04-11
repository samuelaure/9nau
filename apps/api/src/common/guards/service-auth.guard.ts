import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ServiceAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const serviceKey =
      request.headers['x-nau-service-key'] ||
      request.headers['authorization']?.replace('Bearer ', '');

    if (!serviceKey || serviceKey !== process.env.NAU_SERVICE_KEY) {
      throw new UnauthorizedException('Invalid service key');
    }

    return true;
  }
}
