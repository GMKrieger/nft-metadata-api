import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../guards/api-key.guard';

/**
 * Decorator to mark routes as public (no API key required)
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
