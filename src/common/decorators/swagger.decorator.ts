import { applyDecorators } from '@nestjs/common'
import { ApiSecurity } from '@nestjs/swagger'

export const API_SECURITY_AUTH = 'auth'

/**
 * like to @ApiSecurity('auth') swagger判断 token 是否携带
 */
export function ApiSecurityAuth(): ClassDecorator & MethodDecorator {
  return applyDecorators(ApiSecurity(API_SECURITY_AUTH))
}
