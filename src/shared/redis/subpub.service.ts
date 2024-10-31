import { Inject, Injectable } from '@nestjs/common'

import { REDIS_PUBSUB } from './redis.constant'
import { RedisSubPub } from './redis-subpub'

// 提供redis消息发布订阅使用的服务
@Injectable()
export class RedisPubSubService {
  // 注入 RedisSubPub 实例，可以直接使用提供器名，也可以使用类名
  constructor(@Inject(REDIS_PUBSUB) private readonly redisSubPub: RedisSubPub) {}

  public async publish(event: string, data: any) {
    return this.redisSubPub.publish(event, data)
  }

  public async subscribe(event: string, callback: (data: any) => void) {
    return this.redisSubPub.subscribe(event, callback)
  }

  public async unsubscribe(event: string, callback: (data: any) => void) {
    return this.redisSubPub.unsubscribe(event, callback)
  }
}
