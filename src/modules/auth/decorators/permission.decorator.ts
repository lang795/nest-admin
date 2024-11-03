import { applyDecorators, SetMetadata } from '@nestjs/common'

import { isPlainObject } from 'lodash'

import { PERMISSION_KEY } from '../auth.constant'

 type TupleToObject<T extends string, P extends ReadonlyArray<string>> = {
   [K in Uppercase<P[number]>]: `${T}:${Lowercase<K>}`
 }
 type AddPrefixToObjectValue<T extends string, P extends Record<string, string>> = {
   [K in keyof P]: K extends string ? `${T}:${P[K]}` : never
 }

/** 资源操作需要特定的权限，通过在RbacGuard守卫中进行验证 */
export function Perm(permission: string | string[]) {
  // SetMetadata 是 NestJS 提供的一个装饰器，用于将元数据附加到类或方法上。
  // PERMISSION_KEY 是元数据的键，通常是一个常量字符串。permission 是元数据的值，表示特定的权限。
  return applyDecorators(SetMetadata(PERMISSION_KEY, permission))
}

/** (此举非必需)保存通过 definePermission 定义的所有权限，可用于前端开发人员开发阶段的 ts 类型提示，避免前端权限定义与后端定义不匹配 */
let permissions: string[] = []
/**
 * 定义权限，同时收集所有被定义的权限
 *
 * - 通过对象形式定义, eg:
 * ```ts
 * definePermission('app:health', {
 *  NETWORK: 'network'
 * };
 * ```
 *
 * - 通过字符串数组形式定义, eg:
 * ```ts
 * definePermission('app:health', ['network']);
 * ```
 */
export function definePermission<T extends string, U extends Record<string, string>>(modulePrefix: T, actionMap: U): AddPrefixToObjectValue<T, U>
export function definePermission<T extends string, U extends ReadonlyArray<string>>(modulePrefix: T, actions: U): TupleToObject<T, U>
// 格式化处理权限列表数据组合
export function definePermission(modulePrefix: string, actions) {
  if (isPlainObject(actions)) {
    Object.entries(actions).forEach(([key, action]) => {
      actions[key] = `${modulePrefix}:${action}`
    })
    permissions = [...new Set([...permissions, ...Object.values<string>(actions)])]
    return actions
  }
  else if (Array.isArray(actions)) {
    const permissionFormats = actions.map(action => `${modulePrefix}:${action}`)
    permissions = [...new Set([...permissions, ...permissionFormats])]

    return actions.reduce((prev, action) => {
      prev[action.toUpperCase()] = `${modulePrefix}:${action}`
      return prev
    }, {})
  }
}

/** 获取所有通过 definePermission 定义的权限 */
export const getDefinePermissions = () => permissions
