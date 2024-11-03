import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { FastifyRequest } from 'fastify'

import { BusinessException } from '~/common/exceptions/biz.exception'
import { ErrorEnum } from '~/constants/error-code.constant'
import { AuthService } from '~/modules/auth/auth.service'

import { ALLOW_ANON_KEY, PERMISSION_KEY, PUBLIC_KEY, Roles } from '../auth.constant'

// 接口权限守卫
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<any> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic)
      return true

    const request = context.switchToHttp().getRequest<FastifyRequest>()

    const { user } = request
    if (!user)
      throw new BusinessException(ErrorEnum.INVALID_LOGIN)

    // allowAnon 是需要登录后可访问(无需权限), Public 则是无需登录也可访问.
    const allowAnon = this.reflector.get<boolean>(
      ALLOW_ANON_KEY,
      context.getHandler(),
    )
    if (allowAnon)
      return true

    // 获取接口权限配置信息
    const payloadPermission = this.reflector.getAllAndOverride<
      string | string[]
    >(PERMISSION_KEY, [context.getHandler(), context.getClass()])

    // 控制器没有设置接口权限，则默认通过
    if (!payloadPermission)
      return true

    // 管理员放开所有权限
    if (user.roles.includes(Roles.ADMIN))
      return true

    // 获取用户权限
    const allPermissions = await this.authService.getPermissionsCache(user.uid) ?? await this.authService.getPermissions(user.uid)
    // console.log(allPermissions)
    let canNext = false

    // 处理权限字符串，判断是否有权限
    if (Array.isArray(payloadPermission)) {
      // 只要有一个权限满足即可
      canNext = payloadPermission.every(i => allPermissions.includes(i))
    }

    if (typeof payloadPermission === 'string')
      canNext = allPermissions.includes(payloadPermission)

    if (!canNext)
      throw new BusinessException(ErrorEnum.NO_PERMISSION)

    return true
  }
}
