import { applyDecorators } from '@nestjs/common'
import { ApiSecurity } from '@nestjs/swagger'

export const API_SECURITY_AUTH = 'auth'

/**
 * like to @ApiSecurity('auth') 装饰器函数，指定接口需要认证才能调用
 */
export function ApiSecurityAuth(): ClassDecorator & MethodDecorator {
  // 装饰器使用 applyDecorators 函数来应用 ApiSecurity 装饰器，并传递了 API_SECURITY_AUTH 作为参数。
  return applyDecorators(ApiSecurity(API_SECURITY_AUTH))
}

// ApiSecurityAuth：这是一个装饰器函数，可以用于类或方法。
// applyDecorators：这是一个 NestJS 提供的实用函数，用于组合多个装饰器。
// ApiSecurity：这是一个 Swagger 装饰器，用于在 Swagger 文档中指定安全性要求。
// API_SECURITY_AUTH：这是一个常量，表示安全性要求的名称。
