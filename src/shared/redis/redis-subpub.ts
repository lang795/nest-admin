import type { Redis, RedisOptions } from 'ioredis'
import { Logger } from '@nestjs/common'
import IORedis from 'ioredis'

// 用于创建Redis 订阅发布实例，这不是一个服务，而是一个工具类
export class RedisSubPub {
  public pubClient: Redis
  public subClient: Redis
  constructor(
    private redisConfig: RedisOptions,
    private channelPrefix: string = 'm-shop-channel#',
  ) {
    this.init()
  }

  public init() {
    // 初始化 Redis 客户端
    const redisOptions: RedisOptions = {
      host: this.redisConfig.host,
      port: this.redisConfig.port,
    }

    if (this.redisConfig.password)
      redisOptions.password = this.redisConfig.password

    const pubClient = new IORedis(redisOptions)
    const subClient = pubClient.duplicate()
    this.pubClient = pubClient
    this.subClient = subClient
  }

  public async publish(event: string, data: any) {
    const channel = this.channelPrefix + event
    const _data = JSON.stringify(data)
    if (event !== 'log')
      Logger.debug(`发布事件：${channel} <- ${_data}`, RedisSubPub.name)

    await this.pubClient.publish(channel, _data)
  }

  // 订阅函数map，方便取消订阅通知
  private ctc = new WeakMap<(data: any) => void, (channel: string, message: string) => void>()

  public async subscribe(event: string, callback: (data: any) => void) {
    const myChannel = this.channelPrefix + event
    // 订阅一个频道
    this.subClient.subscribe(myChannel)

    // 这里的为了让事件单独一个函数进行订阅，不用在使用时再过滤判断消息来源
    const cb = (channel, message) => {
      if (channel === myChannel) {
        if (event !== 'log')
          Logger.debug(`接收事件：${channel} -> ${message}`, RedisSubPub.name)

        callback(JSON.parse(message))
      }
    }

    this.ctc.set(callback, cb)
    // 订阅频道内的消息
    this.subClient.on('message', cb)
  }

  public async unsubscribe(event: string, callback: (data: any) => void) {
    const channel = this.channelPrefix + event
    this.subClient.unsubscribe(channel)
    const cb = this.ctc.get(callback)
    if (cb) {
      // 取消订阅时，移除相关回调函数
      this.subClient.off('message', cb)

      this.ctc.delete(callback)
    }
  }
}
