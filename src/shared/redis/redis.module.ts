import { RedisModule as NestRedisModule, RedisService } from '@liaoliaots/nestjs-redis'
import { CacheModule } from '@nestjs/cache-manager'
import { Global, Module, Provider } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { redisStore } from 'cache-manager-ioredis-yet'
import { RedisOptions } from 'ioredis'

import { REDIS_CLIENT } from '~/common/decorators/inject-redis.decorator'

import { ConfigKeyPaths, IRedisConfig } from '~/config'
import { CacheService } from './cache.service'
import { REDIS_PUBSUB } from './redis.constant'
import { RedisSubPub } from './redis-subpub'
import { RedisPubSubService } from './subpub.service'

const providers: Provider[] = [
  CacheService,
  {
    // 注入 RedisSubPub 发布订阅 服务
    provide: REDIS_PUBSUB, // 自定义提供器标记名
    useFactory: (configService: ConfigService<ConfigKeyPaths>) => { // 工厂函数，动态创建 RedisSubPub 实例
      const redisOptions: RedisOptions = configService.get<IRedisConfig>('redis')
      return new RedisSubPub(redisOptions)
    },
    inject: [ConfigService], // 注入提供器，作为参数传递给工厂函数
  },
  RedisPubSubService,
  {
    // 注入 Redis 服务
    provide: REDIS_CLIENT,
    useFactory: (redisService: RedisService) => {
      return redisService.getOrThrow()
    },
    inject: [RedisService],
  },
]

// RedisModule 为全局模块
@Global()
@Module({
  imports: [
    // cache 异步配置缓存模块
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => {
        const redisOptions: RedisOptions = configService.get<IRedisConfig>('redis')

        return {
          isGlobal: true,
          store: redisStore,
          isCacheableValue: () => true,
          ...redisOptions,
        }
      },
      inject: [ConfigService],
    }),
    // redis 异步配置redis模块
    NestRedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => ({
        readyLog: true,
        config: configService.get<IRedisConfig>('redis'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers,
  exports: [...providers, CacheModule],
})
export class RedisModule {}
