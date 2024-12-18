import type { FastifyRequest } from 'fastify'

import { ClassSerializerInterceptor, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ThrottlerGuard } from '@nestjs/throttler'
import { ClsModule } from 'nestjs-cls'

import config from '~/config'
import { SharedModule } from '~/shared/shared.module'

import { AllExceptionsFilter } from './common/filters/any-exception.filter'

import { IdempotenceInterceptor } from './common/interceptors/idempotence.interceptor'
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { AuthModule } from './modules/auth/auth.module'
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard'
import { RbacGuard } from './modules/auth/guards/rbac.guard'
import { HealthModule } from './modules/health/health.module'
import { NetdiskModule } from './modules/netdisk/netdisk.module'
import { SseModule } from './modules/sse/sse.module'
import { SystemModule } from './modules/system/system.module'
import { TasksModule } from './modules/tasks/tasks.module'
import { TodoModule } from './modules/todo/todo.module'
import { ToolsModule } from './modules/tools/tools.module'
import { DatabaseModule } from './shared/database/database.module'

import { SocketModule } from './socket/socket.module'

@Module({
  imports: [
    // config配置模块
    ConfigModule.forRoot({
      isGlobal: true, // 全局模块，其他模块不用再imports: [ConfigModule]来使用
      expandVariables: true, // 是否展开变量
      // 指定多个 env 文件时，第一个优先级最高
      envFilePath: ['.env.local', `.env.${process.env.NODE_ENV}`, '.env'],
      load: [...Object.values(config)], // 加载自定义配置文件
    }),
    // 启用 CLS 上下文 ClsModule 是一个用于在 NestJS 应用中管理上下文局部存储（Context Local Storage）的模块。它通常用于在请求生命周期内共享数据，例如用户信息、请求 ID 等。
    ClsModule.forRoot({
      global: true,
      // https://github.com/Papooch/nestjs-cls/issues/92
      interceptor: {
        mount: true,
        setup: (cls, context) => {
          const req = context.switchToHttp().getRequest<FastifyRequest<{ Params: { id?: string } }>>()
          if (req.params?.id && req.body) {
            // 供自定义参数验证器(UniqueConstraint)使用
            cls.set('operateId', Number.parseInt(req.params.id))
          }
        },
      },
    }),
    SharedModule, // 业务框架公共处理模块
    DatabaseModule, // 异步配置TypeORM模块，数据库连接初始化

    AuthModule, // 登录注册，身份认证
    SystemModule, // 管理系统相关接口
    TasksModule.forRoot(), // 定时任务相关服务的提供者，导出提供者别名的方式到全局
    ToolsModule, // 存储 邮件 上传的模块
    SocketModule, // socket服务 模块
    HealthModule, // 系统健康检查
    SseModule,
    NetdiskModule, // 网盘模块

    // biz

    // end biz

    TodoModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },

    // 应用拦截器，框架层接口都是使用APP_INTERCEPTOR拦截处理接口请求和返回的数据
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor }, // 统一处理接口请求与响应结果
    { provide: APP_INTERCEPTOR, useFactory: () => new TimeoutInterceptor(15 * 1000) },
    { provide: APP_INTERCEPTOR, useClass: IdempotenceInterceptor },

    { provide: APP_GUARD, useClass: JwtAuthGuard }, // 所有接口的全局配置守卫
    { provide: APP_GUARD, useClass: RbacGuard }, // 全局守卫，用于接口操作权限控制
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // 接口限流守卫

  ],
})
export class AppModule {}
