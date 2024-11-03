import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import {
  DiskHealthIndicator,
  HealthCheck,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus'

import { definePermission, Perm } from '../auth/decorators/permission.decorator'

export const PermissionHealth = definePermission('app:health', {
  NETWORK: 'network',
  DB: 'database',
  MH: 'memory-heap',
  MR: 'memory-rss',
  DISK: 'disk',
} as const)

@ApiTags('Health - 健康检查')
@Controller('health')
export class HealthController {
  constructor(
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get('network')
  @HealthCheck()
  @Perm(PermissionHealth.NETWORK)
  async checkNetwork() {
    return this.http.pingCheck('buqiyuan', 'https://buqiyuan.gitee.io/')
  }

  @Get('database')
  @HealthCheck()
  @Perm(PermissionHealth.DB)
  async checkDatabase() {
    return this.db.pingCheck('database')
  }

  @Get('memory-heap')
  @HealthCheck()
  @Perm(PermissionHealth.MH)
  async checkMemoryHeap() {
    // 该进程不应使用超过200MB的内存
    return this.memory.checkHeap('memory-heap', 200 * 1024 * 1024)
  }

  @Get('memory-rss')
  @HealthCheck()
  @Perm(PermissionHealth.MR)
  async checkMemoryRSS() {
    // 进程分配的RSS内存不应超过200MB
    return this.memory.checkRSS('memory-rss', 200 * 1024 * 1024)
  }

  @Get('disk')
  @HealthCheck()
  @Perm(PermissionHealth.DISK)
  async checkDisk() {
    return this.disk.checkStorage('disk', {
      // 已用磁盘存储空间不应超过磁盘已满空间的75%
      thresholdPercent: 0.75,
      path: '/',
    })
  }
}
