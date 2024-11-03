import { DynamicModule, ExistingProvider, Module } from '@nestjs/common'

import { LogModule } from '~/modules/system/log/log.module'
import { SystemModule } from '~/modules/system/system.module'

import { EmailJob } from './jobs/email.job'
import { HttpRequestJob } from './jobs/http-request.job'
import { LogClearJob } from './jobs/log-clear.job'

const providers = [LogClearJob, HttpRequestJob, EmailJob]

/**
 * auto create alias 将提供者创建为别名提供者，从而实现在数据库中存提供者别名字符串，然后通过字符串获取提供者，调用业务
 * '定时清空登录日志', 'LogClearJob.clearLoginLog',
 * 用BullModule模块创建定时任务队列，处理数据库中添加的定时任务
 * {
 *    provide: 'LogClearMissionService',
 *    useExisting: LogClearMissionService,
 *  }
 */
function createAliasProviders(): ExistingProvider[] {
  const aliasProviders: ExistingProvider[] = []
  for (const p of providers) {
    aliasProviders.push({
      provide: p.name,
      useExisting: p,
    })
  }
  return aliasProviders
}

/**
 * 所有需要执行的定时任务都需要在这里注册
 */
@Module({})
export class TasksModule {
  static forRoot(): DynamicModule { // 动态模块，初始化别名提供者
    // 使用Alias定义别名，使得可以通过字符串类型获取定义的Service，否则无法获取
    const aliasProviders = createAliasProviders()
    return {
      global: true, // 全局模块
      module: TasksModule,
      imports: [SystemModule, LogModule],
      providers: [...providers, ...aliasProviders],
      exports: aliasProviders, // task.service.ts中使用callService方法调用了任务，通过把任务添加到任务队列中调用
    }
  }
}
