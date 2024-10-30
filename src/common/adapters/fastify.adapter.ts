import FastifyCookie from '@fastify/cookie'
import FastifyMultipart from '@fastify/multipart'
import { FastifyAdapter } from '@nestjs/platform-fastify'

const app: FastifyAdapter = new FastifyAdapter({
  // @see https://www.fastify.io/docs/latest/Reference/Server/#trustproxy
  trustProxy: true, // 信任代理
  logger: false, // 禁用日志
  // forceCloseConnections: true,
})
export { app as fastifyApp }

// 配置multipart/form-data类型请求，文件上传
app.register(FastifyMultipart, {
  limits: {
    fields: 10, // 非文件字段的最大数目
    fileSize: 1024 * 1024 * 6, // 单个文件大小限制
    files: 5, // 文件最大数
  },
})

// 配置cookie规则
app.register(FastifyCookie, {
  secret: 'cookie-secret', // cookie加密密钥
})

// 配置请求拦截器
app.getInstance().addHook('onRequest', (request, reply, done) => {
  // set undefined origin
  const { origin } = request.headers
  if (!origin)
    request.headers.origin = request.headers.host // 解决cors跨域问题，让请求来源和主机地址一致

  // forbidden php

  const { url } = request

  if (url.endsWith('.php')) {
    reply.raw.statusMessage
      = 'Eh. PHP is not support on this machine. Yep, I also think PHP is bestest programming language. But for me it is beyond my reach.'

    return reply.code(418).send()
  }

  // skip favicon request
  if (url.match(/favicon.ico$/) || url.match(/manifest.json$/))
    return reply.code(204).send()

  done()
})
