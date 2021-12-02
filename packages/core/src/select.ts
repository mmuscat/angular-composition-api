import {
   Accessor,
   AccessorValue,
   AsyncEmitter,
   Emitter,
   ExpandValue,
   UseOptions,
   Value,
} from "./interfaces"
import {
   AccessorValue as AccessorValueType,
   ComputedValue,
   flush,
   setPending,
} from "./types"
import { get, getPath, isEmitter, isObject, isValue, walk } from "./utils"
import { Subject } from "rxjs"

export function select<T, U>(
   accessor: Accessor<T, U>,
   options?: UseOptions<any>,
): AccessorValue<T, U>
export function select<T extends Value<any> | Emitter<any>>(
   source: T,
   options?: UseOptions<any>,
): unknown
export function select<T>(source: () => T, options?: UseOptions<any>): Value<T>
export function select(
   source: (() => any) | Accessor<any, any> | Value<any> | Emitter<any>,
   options?: UseOptions<any>,
): unknown {
   if (typeof source === "function" && !isValue(source) && !isEmitter(source)) {
      return new ComputedValue(source) as any
   }
   return new AccessorValueType(source as any, options)
}

export function async<T, U>(
   accessor: Accessor<T, U>,
   options?: UseOptions<any>,
): AsyncEmitter<T, U>
export function async(
   source: Accessor<any, any>,
   options?: UseOptions<any>,
): unknown {
   const emitter = new AccessorValueType(source as any, {
      ...options,
      subject: options?.subject ?? new Subject(),
   })
   ;(<any>emitter).__ng_emitter = true
   delete (<any>emitter).__check_phase
   return emitter
}

export function combine<T>(object: Value<T>): Value<T>
export function combine<T extends {}>(
   object: T,
): AccessorValue<ExpandValue<T>, ExpandValue<T, true>>
export function combine(
   object: any,
):
   | AccessorValue<ExpandValue<unknown>, ExpandValue<unknown, true>>
   | Value<unknown> {
   if (isValue(object)) return object
   const computed = select(() => get(object))
   return select({
      next(nextValue: any) {
         let shouldTrigger = true
         const previous = setPending(true)
         try {
            walk(nextValue, (val, path, done) => {
               const [key, ...rest] = path
               const target = getPath(object, rest)
               if (!target || !(key in target)) {
                  throw new Error(
                     `Target object does not have existing key "${key}" in object path "${rest
                        .reverse()
                        .join(".")}"`,
                  )
               }
               if (isValue(target[key])) {
                  shouldTrigger = false
                  target[key](val)
                  done()
               } else if (!isObject(target[key])) {
                  target[key] = val
               }
            })
            if (shouldTrigger) {
               computed(computed.value)
            }
         } finally {
            setPending(previous)
            flush()
         }
      },
      value: computed,
   }) as AccessorValue<ExpandValue<any>, ExpandValue<any, true>>
}
