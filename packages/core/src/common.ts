import {
   identity,
   isObservable,
   Observable,
   PartialObserver,
   Subscription,
   TeardownLogic,
   UnaryFunction,
} from "rxjs"
import {
   ContentChild,
   ContentChildren,
   ElementRef,
   InjectionToken,
   QueryList,
   Renderer2,
   ViewChild,
   ViewChildren,
} from "@angular/core"
import {
   AccessorValue,
   CheckPhase,
   Emitter,
   EmitterWithParams,
   ErrorState,
   QueryListType,
   QueryType,
   ReadonlyValue,
   UnsubscribeSignal,
   UseOptions,
   Value,
} from "./interfaces"
import {accept, isClass, isEmitter, isObserver, isSignal, isValue} from "./utils"
import { addEffect, addTeardown, inject } from "./core"
import {
   DeferredValue,
   Emitter as EmitterType,
   Value as ValueType,
} from "./types"
import { select } from "./select"

export class QueryListValue extends QueryList<any> {
   subscription?: Subscription
   get value() {
      return this
   }
   next(value: QueryList<any>) {
      this.subscription?.unsubscribe()
      this.reset(value.toArray())
      this.notifyOnChanges()
      this.subscription = value.changes.subscribe(this)
   }
   subscribe(observer: any) {
      accept(observer, this, void 0, "N")
      return this.changes.subscribe(observer)
   }
   complete() {
      this.destroy()
   }
}

const queryMap = new Map<Function, CheckPhase>([
   [ContentChild, 6],
   [ContentChildren, 6],
   [ViewChild, 7],
   [ViewChildren, 7],
])

function isQuery(value: any) {
   return queryMap.has(value)
}

export function use<T>(): Value<T | undefined>
export function use<T>(value: QueryListType): ReadonlyValue<QueryList<T>>
export function use<T>(value: QueryType): ReadonlyValue<T | undefined>
export function use<T>(value: typeof Function): Emitter<T>
export function use<T>(value: Value<T>, options?: UseOptions<T>): Emitter<T>
export function use<T, U>(
   value: AccessorValue<T, U>,
   options?: UseOptions<T>,
): Emitter<T>
export function use<T>(value: ReadonlyValue<T>): never
export function use<T>(value: Emitter<T>): Value<T>
export function use<T>(
   value: Observable<T>,
   options?: UseOptions<T>,
): Value<T | undefined>
export function use<T extends (...args: any) => any>(
   value: EmitterWithParams<T>,
): Value<T>
export function use<T extends (...args: any[]) => any>(
   value: T,
): EmitterWithParams<T>
export function use<T>(value: T, options?: UseOptions<T>): Value<T>
export function use<T>(value: T, options?: UseOptions<T>): Value<T>
export function use(value?: any, options?: UseOptions<unknown>): unknown {
   if (isQuery(value)) {
      const phase = queryMap.get(value)!
      if (value === ContentChildren || value === ViewChildren) {
         return new DeferredValue(new QueryListValue(), phase)
      }
      return new ValueType(void 0, phase, options)
   }
   if (isValue(value) || (typeof value === "function" && !isEmitter(value)) && !isClass(value)) {
      return new EmitterType(value)
   }
   if (isObservable(value)) {
      return new DeferredValue(value, 5, options)
   }
   return new ValueType(value, 5, options)
}

export function subscribe<T>(): Subscription
export function subscribe<T>(observer: () => TeardownLogic): Subscription
export function subscribe<T>(source: Observable<T>): Subscription
export function subscribe<T>(
   source: Observable<T>,
   observer: PartialObserver<T>,
): Subscription
export function subscribe<T>(
   source: Observable<T>,
   observer: (value: T) => TeardownLogic,
): Subscription
export function subscribe<T>(
   source: Observable<T>,
   signal: UnsubscribeSignal,
): Subscription
export function subscribe<T>(
   source: Observable<T>,
   observer: PartialObserver<T> | ((value: T) => TeardownLogic),
   signal: UnsubscribeSignal,
): Subscription
export function subscribe<T>(
   source?: Observable<T> | (() => TeardownLogic),
   observerOrSignal?:
      | PartialObserver<T>
      | ((value: T) => TeardownLogic)
      | UnsubscribeSignal,
   signal?: UnsubscribeSignal,
): Subscription {
   const observer = isObserver(observerOrSignal) ? observerOrSignal : void 0
   signal = isSignal(observerOrSignal) ? observerOrSignal : signal

   if (!source) {
      const subscription = new Subscription()
      addTeardown(subscription)
      return subscription
   }

   return addEffect(source, observer, signal)
}

type ListenerFunction<T> = (event: T) => TeardownLogic

export function listen<T>(eventName: string): Emitter<T>
export function listen<T>(handler: ListenerFunction<T>): Emitter<T>
export function listen<T>(
   eventName: string,
   handler?: ListenerFunction<T>,
): Emitter<T>
export function listen<T>(
   target: unknown,
   eventName: string,
   handler?: ListenerFunction<T>,
): Emitter<T>
export function listen<T>(
   target: Observable<unknown>,
   eventName: string,
   handler?: ListenerFunction<T>,
): Emitter<T>
export function listen() {
   let eventName: string | undefined
   let handler: ListenerFunction<any> | undefined
   let target: unknown
   if (arguments.length === 1) {
      if (typeof arguments[0] === "string") {
         eventName = arguments[0]
      } else {
         handler = arguments[0]
      }
   }
   if (arguments.length === 2) {
      if (typeof arguments[1] === "function") {
         eventName = arguments[0]
         handler = arguments[1]
      } else {
         target = arguments[0]
         eventName = arguments[1]
      }
   }
   if (arguments.length === 3) {
      target = arguments[0]
      eventName = arguments[1]
      handler = arguments[2]
   }
   const emitter = use(Function)
   if (eventName) {
      const renderer = inject(Renderer2)
      if (isObservable(target)) {
         subscribe(target, (element) => {
            if (element) {
               renderer.listen(element, eventName!, emitter)
            }
         })
      } else {
         const element = target ?? inject(ElementRef).nativeElement
         renderer.listen(element, eventName, emitter)
      }
   }
   subscribe(emitter, handler!)
   return emitter
}

export const Attribute = new InjectionToken("Attribute", {
   factory() {
      return function getAttribute(qualifiedName: string) {
         const { nativeElement } = inject<ElementRef<HTMLElement>>(ElementRef)
         return nativeElement.getAttribute(qualifiedName)
      }
   },
})

const noCast = (value: string | null) => value

export function attribute<T>(
   qualifiedName: string,
   cast: (value: string | null) => T,
): Value<T>
export function attribute(qualifiedName: string): Value<string | null>
export function attribute(qualifiedName: string, cast = noCast): unknown {
   const getAttribute = inject(Attribute)
   const attr = getAttribute(qualifiedName)
   const value = use(cast(attr === "" ? qualifiedName : attr))
   return select({
      next(nextValue: any) {
         value(cast(nextValue === "" ? qualifiedName : nextValue))
      },
      value,
   })
}

export function onError(
   value: Value<any>,
   handler: (error: unknown, state: ErrorState) => Observable<any> | void,
): Value<ErrorState | undefined> {
   const error = use<ErrorState | undefined>()
   const signal = subscribe()
   let retries = 0
   const remove = value.onError((e: any) => {
      const state = {
         error: e,
         message: e?.message,
         retries,
      }
      retries++
      error(state)
      const result = handler(e, state)
      if (isObservable(result)) {
         const reviver = use(result)
         let done: any
         const sub = subscribe(
            reviver,
            () => {
               done = sub ? sub.unsubscribe() : true
               error(void 0)
            },
            signal,
         )
         if (done) sub.unsubscribe()
         return reviver
      }
      return
   })
   addTeardown(remove)
   return error
}

export function pipe(): typeof identity
export function pipe<T>(source: T): Value<T | undefined>
export function pipe<T, A>(
   source: T,
   fn1: UnaryFunction<T, A>,
): Value<A extends Observable<infer R> ? R | undefined : never>
export function pipe<T, A, B>(
   source: T,
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
): Value<B extends Observable<infer R> ? R | undefined : never>
export function pipe<T, A, B, C>(
   source: T,
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
): Value<C extends Observable<infer R> ? R | undefined : never>
export function pipe<T, A, B, C, D>(
   source: T,
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
   fn4: UnaryFunction<C, D>,
): Value<D extends Observable<infer R> ? R | undefined : never>
export function pipe<T, A, B, C, D, E>(
   source: T,
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
   fn4: UnaryFunction<C, D>,
   fn5: UnaryFunction<D, E>,
): Value<E extends Observable<infer R> ? R | undefined : never>
export function pipe<T, A, B, C, D, E, F>(
   source: T,
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
   fn4: UnaryFunction<C, D>,
   fn5: UnaryFunction<D, E>,
   fn6: UnaryFunction<E, F>,
): Value<F extends Observable<infer R> ? R | undefined : never>
export function pipe<T, A, B, C, D, E, F, G>(
   source: T,
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
   fn4: UnaryFunction<C, D>,
   fn5: UnaryFunction<D, E>,
   fn6: UnaryFunction<E, F>,
   fn7: UnaryFunction<F, G>,
): Value<G extends Observable<infer R> ? R | undefined : never>
export function pipe<T, A, B, C, D, E, F, G, H>(
   source: T,
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
   fn4: UnaryFunction<C, D>,
   fn5: UnaryFunction<D, E>,
   fn6: UnaryFunction<E, F>,
   fn7: UnaryFunction<F, G>,
   fn8: UnaryFunction<G, H>,
): Value<H extends Observable<infer R> ? R | undefined : never>
export function pipe<T, A, B, C, D, E, F, G, H, I>(
   source: T,
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
   fn4: UnaryFunction<C, D>,
   fn5: UnaryFunction<D, E>,
   fn6: UnaryFunction<E, F>,
   fn7: UnaryFunction<F, G>,
   fn8: UnaryFunction<G, H>,
   fn9: UnaryFunction<H, I>,
): Value<I extends Observable<infer R> ? R | undefined : never>
export function pipe<T, A, B, C, D, E, F, G, H, I>(
   source: Observable<T>,
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
   fn4: UnaryFunction<C, D>,
   fn5: UnaryFunction<D, E>,
   fn6: UnaryFunction<E, F>,
   fn7: UnaryFunction<F, G>,
   fn8: UnaryFunction<G, H>,
   fn9: UnaryFunction<H, I>,
   ...fns: UnaryFunction<any, any>[]
): Value<unknown | undefined>
export function pipe<T, A>(fn1: UnaryFunction<T, A>): UnaryFunction<T, A>
export function pipe<T, A, B>(
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
): UnaryFunction<T, B>
export function pipe<T, A, B, C>(
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
): UnaryFunction<T, C>
export function pipe<T, A, B, C, D>(
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
   fn4: UnaryFunction<C, D>,
): UnaryFunction<T, D>
export function pipe<T, A, B, C, D, E>(
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
   fn4: UnaryFunction<C, D>,
   fn5: UnaryFunction<D, E>,
): UnaryFunction<T, E>
export function pipe<T, A, B, C, D, E, F>(
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
   fn4: UnaryFunction<C, D>,
   fn5: UnaryFunction<D, E>,
   fn6: UnaryFunction<E, F>,
): UnaryFunction<T, F>
export function pipe<T, A, B, C, D, E, F, G>(
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
   fn4: UnaryFunction<C, D>,
   fn5: UnaryFunction<D, E>,
   fn6: UnaryFunction<E, F>,
   fn7: UnaryFunction<F, G>,
): UnaryFunction<T, G>
export function pipe<T, A, B, C, D, E, F, G, H>(
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
   fn4: UnaryFunction<C, D>,
   fn5: UnaryFunction<D, E>,
   fn6: UnaryFunction<E, F>,
   fn7: UnaryFunction<F, G>,
   fn8: UnaryFunction<G, H>,
): UnaryFunction<T, H>
export function pipe<T, A, B, C, D, E, F, G, H, I>(
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
   fn4: UnaryFunction<C, D>,
   fn5: UnaryFunction<D, E>,
   fn6: UnaryFunction<E, F>,
   fn7: UnaryFunction<F, G>,
   fn8: UnaryFunction<G, H>,
   fn9: UnaryFunction<H, I>,
): UnaryFunction<T, I>
export function pipe<T, A, B, C, D, E, F, G, H, I>(
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
   fn4: UnaryFunction<C, D>,
   fn5: UnaryFunction<D, E>,
   fn6: UnaryFunction<E, F>,
   fn7: UnaryFunction<F, G>,
   fn8: UnaryFunction<G, H>,
   fn9: UnaryFunction<H, I>,
   ...fns: UnaryFunction<any, any>[]
): UnaryFunction<T, unknown>
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
