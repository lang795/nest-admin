import type { ConfigKeyPaths } from './config'
import cluster from 'node:cluster'

import path from 'node:path'
import {
  HttpStatus,
  Logger,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'

import { NestFastifyApplication } from '@nestjs/platform-fastify'

import { useContainer } from 'class-validator'

import { AppModule } from './app.module'
import { fastifyApp } from './common/adapters/fastify.adapter'
import { RedisIoAdapter } from './common/adapters/socket.adapter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { isDev, isMainProcess } from './global/env'
import { setupSwagger } from './setup-swagger'
import { LoggerService } from './shared/logger/logger.service'

declare const module: any

async function bootstrap() {
  // fastifyApp 是一个 FastifyAdapter 实例，配置底层http服务器使用fastify方案适配器
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyApp,
    {
      bufferLogs: true, // 缓冲日志 应用程序会在启动过程中将日志消息缓冲起来，而不是立即输出。 提高启动性能
      snapshot: true, // 快照
      // forceCloseConnections: true, // 服务关闭强制关闭连接
    },
  )

  // 配置名称空间
  // 这里与其他地方使用无关，只是为了bootstrap函数中的configService.get('app', { infer: true })能够获取到类型
  const configService = app.get(ConfigService<ConfigKeyPaths>)

  const { port, globalPrefix } = configService.get('app', { infer: true })

  // class-validator DTO类中注入 nest 容器的依赖 (用于自定义验证器)，即能使用class-validator的IsInt这些装饰器进行参数等的验证
  // 把所有接口的参数，都用用class形式的DTO来接收，然后在DTO中使用class-validator的装饰器来验证参数
  useContainer(app.select(AppModule), { fallbackOnErrors: true })

  // 允许跨域
  app.enableCors({ origin: '*', credentials: true })
  // 设置api全局前缀
  app.setGlobalPrefix(globalPrefix)
  // 静态资源目录
  app.useStaticAssets({ root: path.join(__dirname, '..', 'public') })
  // Starts listening for shutdown hooks
  // 程序退出时，会执行这个钩子函数，可以用来做一些清理工作，正确地释放资源
  !isDev && app.enableShutdownHooks()

  if (isDev) {
    // 全局拦截器
    app.useGlobalInterceptors(new LoggingInterceptor())
  }

  // 全局管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 自动转换传入的参数类型
      whitelist: true, // 只允许通过验证的参数传入
      transformOptions: { enableImplicitConversion: true }, // 启用隐式类型转换
      // forbidNonWhitelisted: true, // 禁止 无装饰器验证的数据通过
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY, // 错误状态码
      stopAtFirstError: true, // 在第一个验证错误时停止验证，而不是验证所有字段
      exceptionFactory: errors => // 自定义错误信息
        new UnprocessableEntityException(
          errors.map((e) => { // 取出第一个错误信息
            const rule = Object.keys(e.constraints!)[0]
            const msg = e.constraints![rule]
            return msg
          })[0],
        ),
    }),
  )

  // 使用redis适配器
  app.useWebSocketAdapter(new RedisIoAdapter(app))

  // 配置swagger
  setupSwagger(app, configService)

  await app.listen(port, '0.0.0.0', async () => {
    // 自定义日志服务
    app.useLogger(app.get(LoggerService))
    const url = await app.getUrl()
    const { pid } = process
    const env = cluster.isPrimary
    const prefix = env ? 'P' : 'W'

    if (!isMainProcess)
      return

    const logger = new Logger('NestApplication')
    logger.log(`[${prefix + pid}] Server running on ${url}`)

    if (isDev)
      logger.log(`[${prefix + pid}] OpenAPI: ${url}/api-docs`)
  })

  if (module.hot) {
    module.hot.accept()
    module.hot.dispose(() => app.close())
  }
}

bootstrap()
