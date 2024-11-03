import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'

import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ConfigKeyPaths, IRedisConfig } from '~/config'

import { LogModule } from '../log/log.module'

import { SYS_TASK_QUEUE_NAME, SYS_TASK_QUEUE_PREFIX } from './constant'

import { TaskController } from './task.controller'
import { TaskEntity } from './task.entity'
import { TaskConsumer } from './task.processor'
import { TaskService } from './task.service'

const providers = [TaskService, TaskConsumer]

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskEntity]),
    // 异步注册一个 Bull 队列。Bull 是一个基于 Redis 的高性能队列库，常用于处理后台任务和作业队列
    // 可以在里面加入常驻的定时任务，SYS_TASK_QUEUE_NAME为队列名称
    BullModule.registerQueueAsync({
      name: SYS_TASK_QUEUE_NAME,
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => ({
        redis: configService.get<IRedisConfig>('redis'),
        prefix: SYS_TASK_QUEUE_PREFIX,
      }),
      inject: [ConfigService],
    }),
    LogModule,
  ],
  controllers: [TaskController],
  providers: [...providers],
  exports: [TypeOrmModule, ...providers],
})
export class TaskModule {}
