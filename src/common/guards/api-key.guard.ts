import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // For now, we'll do basic validation
    // In production, you'd validate against a database
    if (!this.validateApiKey(apiKey)) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Attach API key to request for later use in analytics
    (request as any).apiKey = apiKey;

    return true;
  }

  private extractApiKey(request: Request): string | null {
    // Check X-API-Key header
    const headerKey = request.headers['x-api-key'];
    if (headerKey) {
      return Array.isArray(headerKey) ? headerKey[0] : headerKey;
    }

    // Check Authorization header (Bearer token)
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check query parameter (less secure, but convenient for testing)
    const queryKey = request.query.apiKey;
    if (queryKey) {
      if (typeof queryKey === 'string') {
        return queryKey;
      }
      if (Array.isArray(queryKey)) {
        return String(queryKey[0]);
      }
    }

    return null;
  }

  private validateApiKey(apiKey: string): boolean {
    // Basic validation: check if key is not empty and has minimum length
    if (!apiKey || apiKey.length < 16) {
      return false;
    }

    // For development, accept any key with proper format
    // In production, you would:
    // 1. Hash the API key
    // 2. Query database for matching key
    // 3. Check if key is active and not expired
    const isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';

    if (isDevelopment) {
      // Accept any key in development
      return true;
    }

    // Production validation would go here
    // For now, we'll accept a test key from environment
    const validTestKey = this.configService.get<string>('API_TEST_KEY');
    return apiKey === validTestKey;
  }
}
