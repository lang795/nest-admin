import { Inject } from '@nestjs/common'

export const REDIS_CLIENT = Symbol('REDIS_CLIENT')

// 自定义 InjectRedis 装饰器，能够使用REDIS_CLIENT标记的依赖注入的服务实例
export const InjectRedis = () => Inject(REDIS_CLIENT)
