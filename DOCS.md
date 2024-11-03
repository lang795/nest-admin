## 模块文档
- ConfigService: https://wdk-docs.github.io/nest-docs/techniques/configuration/#_2
- app.useWebSocketAdapter(new RedisIoAdapter(app)): https://wdk-docs.github.io/nest-docs/blog/posts/scalable-websockets-with-nestjs-and-redis/
- nestjs/swagger: https://docs.nestjs.com/openapi/types-and-parameters
- typeorm: https://typeorm.bootcss.com/entities

## 内容说明
- providers 将由 Nest 注入器实例化并且至少可以在该模块中共享的提供程序
- controllers 此模块中定义的必须实例化的控制器集
- imports 导出此模块所需的提供程序的导入模块（也就是module）列表，实际是导入module的exorpts导出的提供者
- exports 这个模块提供的 providers 的子集应该在导入这个模块的其他模块中可用。你可以使用提供器本身或仅使用其令牌（provide 值）（导出的必须是当前module的imports导入的或者providers提供的）
- forRoot() 方法可以同步或异步（即通过 Promise）返回动态模块。
- 只要传入providers等的这些服务类，都会被实例化

## redis流程
- imports中导入RedisModule异步配置并创建redis实例（也就是RedisService实例）
- providers中动态创建提供者，使用依赖注入的方式自动解析注入RedisService服务实例，并用REDIS_CLIENT标记
- 标记RedisModule为全局模块，提供者可以在全局范围内使用
- 将REDIS_CLIENT标记对应的服务实例，也创建为一个装饰器InjectRedis，其他模块可以使用InjectRedis装饰器注入redis实例

## 用于登录
- https://juejin.cn/post/7377644162827091977?searchId=202411031009398988E3E7FBC2CAFCCF2B
- Passport是基于express的身份验证库，可配合他的内置策略进行用户信息和身份信息验证，登录登出等
- 客户端将首先使用用户名和密码进行身份验证。通过身份验证后，服务器将发出 JWT，该 JWT 可在后续请求的请求头中作为令牌发送，以证明身份验证
- jwt身份验证，JwtAuthGuard，使用.strategy配置策略在request.user上挂身份信息，使用guard配置守卫进行验证拦截
- { provide: APP_GUARD, useClass: JwtAuthGuard }配置全局所有接口都需要进行验证，而不需要显示使用@UseGuards(JwtAuthGuard)装饰器，但可以使用@Public装饰器让接口不进行验证

## task定时任务
- app.module中导入TasksModule.forRoot()完成task服务提供者实例化，并注册到全局，TasksModule进行了提供者别名转换，让调用任务能直接使用服务名+方法名进行调用，从而实现任务函数名存库
- system/task 的task.module中通过BullModule创建一个redis任务队列，通过将定时任务添加到任务队列中进行执行
- system/task 的task.service中完成task管理的相关操作

## 接口调用权限
- @Perm 装饰器实现了将权限值附加到权限类上
- 全局首位RbacGuard中定义接口权限验证逻辑，用于验证接口是否有调用权限
