import { forwardRef, Module, Provider } from '@nestjs/common'

import { AuthModule } from '../modules/auth/auth.module'
import { SystemModule } from '../modules/system/system.module'

import { AdminEventsGateway } from './events/admin.gateway'
import { WebEventsGateway } from './events/web.gateway'

// 实例化的2个socket服务，暂时没用到
const providers: Provider[] = [AdminEventsGateway, WebEventsGateway]

@Module({
  // forwardRef模块间的循环依赖问题
  imports: [forwardRef(() => SystemModule), AuthModule],
  providers,
  exports: [...providers],
})
export class SocketModule {}
