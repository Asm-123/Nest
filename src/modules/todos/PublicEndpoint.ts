// src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';

export const PublicEndpoint = () => SetMetadata('isPublic', true);
