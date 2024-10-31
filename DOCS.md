## 模块文档
- ConfigService: https://wdk-docs.github.io/nest-docs/techniques/configuration/#_2
- app.useWebSocketAdapter(new RedisIoAdapter(app)): https://wdk-docs.github.io/nest-docs/blog/posts/scalable-websockets-with-nestjs-and-redis/

## 内容说明
- providers 将由 Nest 注入器实例化并且至少可以在该模块中共享的提供程序
- controllers 此模块中定义的必须实例化的控制器集
- imports 导出此模块所需的提供程序的导入模块（也就是module）列表，实际是导入module的exorpts导出的提供者
- exports 这个模块提供的 providers 的子集应该在导入这个模块的其他模块中可用。你可以使用提供器本身或仅使用其令牌（provide 值）（导出的必须是当前module的imports导入的或者providers提供的）
- forRoot() 方法可以同步或异步（即通过 Promise）返回动态模块。
