import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'

import { AuthStrategy } from '../auth.constant'
import { AuthService } from '../auth.service'

// 验证用户名密码
@Injectable()
export class LocalStrategy extends PassportStrategy(
  Strategy,
  AuthStrategy.LOCAL,
) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'credential', // 指定传入的字段名
      passwordField: 'password',
    })
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password)
    return user
  }
}
