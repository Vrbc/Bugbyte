import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export type CurrentUserPayload = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

type AuthenticatedRequest = Request & {
  user: CurrentUserPayload;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserPayload => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.user;
  },
);
