import { Global, Module, type Provider } from '@nestjs/common'

import { CronService } from './cron.service'
import { QQService } from './qq.service'

const providers: Provider[] = [
  CronService, // 实例化定时调度任务服务
  QQService, // 实例化 QQ 服务
]

// 全局，导出服务
@Global()
@Module({
  imports: [],
  providers,
  exports: providers,
})
export class HelperModule {}
