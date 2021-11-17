import {
   isObservable,
   Observable,
   PartialObserver,
   Subscription,
   UnaryFunction,
   identity
} from "rxjs"
import {
   Emitter,
   ExpandValue,
   Notification,
   UnsubscribeSignal,
   Value,
} from "./interfaces"
import { use } from "./common"

export function isObject(value: unknown): value is {} {
   return typeof value === "object" && value !== null
}

export function isEmitter(value: any): value is Emitter<any> {
   return typeof value === "function" && "__ng_emitter" in value
}

export function isValue(value: any): value is Value<any> {
   return typeof value === "function" && "__ng_value" in value
}

export function isSignal(value: any): value is UnsubscribeSignal {
   return (
      value === null ||
      value instanceof Subscription ||
      value instanceof AbortSignal
   )
}

export function isObserver(
   observer: any,
): observer is PartialObserver<any> | Function {
   return (observer && "next" in observer) || typeof observer === "function"
      ? observer
      : void 0
}

export function accept<T>(
   observer: PartialObserver<any> | ((value: T) => any),
   value: T,
   error: unknown,
   kind: string,
) {
   if (typeof observer === "function") {
      if (kind === "N") return observer(value)
      return
   }
   return kind === "N"
      ? observer.next?.(value!)
      : kind === "E"
      ? observer.error?.(error)
      : observer.complete?.()
}

export function observeNotification<T>(
   notification: Notification<T>,
   observer: PartialObserver<T> | ((value: T) => any),
): any {
   const { kind, value, error } = notification as any
   if (typeof kind !== "string") {
      throw new TypeError('Invalid notification, missing "kind"')
   }
   return accept(observer, value, error, kind)
}

export function getPath(value: any, path: string[]): any {
   if (!path.length) return value
   return path.reduceRight((val: any, key) => val?.[key], value)
}

export function walk<T extends { [key: string]: any }>(
   object: T,
   next: (value: any, path: string[], done: Function) => any,
   path: string[] = [],
   acc = {} as any
): { [key: string]: any } {
   let isDone = false
   function done() {
      isDone = true
   }
   return Object.getOwnPropertyNames(object).reduce((acc, key) => {
      isDone = false
      const value = object[key]
      const currentPath = [key, ...path]
      acc[key] = next(value, currentPath, done)
      if (isObject(value) && !isDone) {
         walk(value, next, currentPath, acc[key])
      }
      return acc
   }, acc)
}

function read(current: any, done: Function) {
   return Array.isArray(current) ? (done(), current) : isObject(current) ? {...current} : current
}

export function get<T extends {}>(value: T): ExpandValue<T>
export function get<T>(value: Value<T>): T
export function get(value: any) {
   if (isValue(value)) return value()
   return walk(value, (current, path, done) => (isValue(current) ? current() : read(current, done)))
}

export function access<T extends {}>(value: T): ExpandValue<T>
export function access<T>(value: Value<T>): T
export function access(value: any) {
   if (isValue(value)) return value.value
   return walk(value, (current, path, done) => (isValue(current) ? current.value : read(current, done)))
}

export function pipe(): typeof identity;
export function pipe<T>(source: T): Value<T | undefined>;
export function pipe<T, A>(source: T, fn1: UnaryFunction<T, A>): Value<A extends Observable<infer R> ? R | undefined : never>;
export function pipe<T, A, B>(source: T, fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>): Value<B extends Observable<infer R> ? R | undefined : never>;
export function pipe<T, A, B, C>(source: T, fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>): Value<C extends Observable<infer R> ? R | undefined : never>;
export function pipe<T, A, B, C, D>(source: T, fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>): Value<D extends Observable<infer R> ? R | undefined : never>;
export function pipe<T, A, B, C, D, E>(source: T, fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>, fn5: UnaryFunction<D, E>): Value<E extends Observable<infer R> ? R | undefined : never>;
export function pipe<T, A, B, C, D, E, F>(source: T, fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>, fn5: UnaryFunction<D, E>, fn6: UnaryFunction<E, F>): Value<F extends Observable<infer R> ? R | undefined : never>;
export function pipe<T, A, B, C, D, E, F, G>(source: T, fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>, fn5: UnaryFunction<D, E>, fn6: UnaryFunction<E, F>, fn7: UnaryFunction<F, G>): Value<G extends Observable<infer R> ? R | undefined : never>;
export function pipe<T, A, B, C, D, E, F, G, H>(source: T, fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>, fn5: UnaryFunction<D, E>, fn6: UnaryFunction<E, F>, fn7: UnaryFunction<F, G>, fn8: UnaryFunction<G, H>): Value<H extends Observable<infer R> ? R | undefined : never>;
export function pipe<T, A, B, C, D, E, F, G, H, I>(source: T, fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>, fn5: UnaryFunction<D, E>, fn6: UnaryFunction<E, F>, fn7: UnaryFunction<F, G>, fn8: UnaryFunction<G, H>, fn9: UnaryFunction<H, I>): Value<I extends Observable<infer R> ? R | undefined : never>;
export function pipe<T, A, B, C, D, E, F, G, H, I>(source: Observable<T>, fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>, fn5: UnaryFunction<D, E>, fn6: UnaryFunction<E, F>, fn7: UnaryFunction<F, G>, fn8: UnaryFunction<G, H>, fn9: UnaryFunction<H, I>, ...fns: UnaryFunction<any, any>[]): Value<unknown | undefined>;
export function pipe<T, A>(fn1: UnaryFunction<T, A>): UnaryFunction<T, A>;
export function pipe<T, A, B>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>): UnaryFunction<T, B>;
export function pipe<T, A, B, C>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>): UnaryFunction<T, C>;
export function pipe<T, A, B, C, D>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>): UnaryFunction<T, D>;
export function pipe<T, A, B, C, D, E>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>, fn5: UnaryFunction<D, E>): UnaryFunction<T, E>;
export function pipe<T, A, B, C, D, E, F>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>, fn5: UnaryFunction<D, E>, fn6: UnaryFunction<E, F>): UnaryFunction<T, F>;
export function pipe<T, A, B, C, D, E, F, G>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>, fn5: UnaryFunction<D, E>, fn6: UnaryFunction<E, F>, fn7: UnaryFunction<F, G>): UnaryFunction<T, G>;
export function pipe<T, A, B, C, D, E, F, G, H>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>, fn5: UnaryFunction<D, E>, fn6: UnaryFunction<E, F>, fn7: UnaryFunction<F, G>, fn8: UnaryFunction<G, H>): UnaryFunction<T, H>;
export function pipe<T, A, B, C, D, E, F, G, H, I>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>, fn5: UnaryFunction<D, E>, fn6: UnaryFunction<E, F>, fn7: UnaryFunction<F, G>, fn8: UnaryFunction<G, H>, fn9: UnaryFunction<H, I>): UnaryFunction<T, I>;
export function pipe<T, A, B, C, D, E, F, G, H, I>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>, fn4: UnaryFunction<C, D>, fn5: UnaryFunction<D, E>, fn6: UnaryFunction<E, F>, fn7: UnaryFunction<F, G>, fn8: UnaryFunction<G, H>, fn9: UnaryFunction<H, I>, ...fns: UnaryFunction<any, any>[]): UnaryFunction<T, unknown>
export function pipe(...args: any[]): unknown {
   if (args.length === 0) {
      return (value: any) => use(value)
   }
   if (isObservable(args[0])) {
      return use((<any>args[0]).pipe(...args.slice(1)))
   } else {
      return function (source: Observable<unknown>) {
         return (<any>pipe)(source, ...args)
      }
   }
}
