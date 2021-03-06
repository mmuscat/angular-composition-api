import {
   isObservable,
   NextObserver,
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
   CheckPhase,
   DeferredValue,
   DeferredValueOptions,
   Emitter,
   EmitterWithParams,
   ErrorState,
   QueryListType,
   QueryType,
   ReadonlyValue,
   UnsubscribeSignal,
   Value,
   ValueOptions,
} from "./interfaces"
import { isClass, isEmitter, isObserver, isSignal, isValue } from "./utils"
import { addEffect, addTeardown, inject } from "./core"
import {
   DeferredValue as DeferredValueType,
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
export function use<T>(value: typeof Function): Emitter<T>
export function use<T>(
   value: Observable<T>,
   options?: ValueOptions<T>,
): DeferredValue<T>
export function use<T>(
   value: Observable<T>,
   options: DeferredValueOptions<T>,
): Value<T>
export function use<T>(value: QueryListType): Value<QueryList<T>>
export function use<T>(value: QueryType): DeferredValue<T>
export function use<T>(value: T, options?: ValueOptions<T>): Value<T>
export function use<T extends (...args: any) => any>(
   value: EmitterWithParams<T>,
): Value<T>
export function use<T extends (...args: any[]) => any>(
   value: T,
): EmitterWithParams<T>
export function use(value?: any, options?: ValueOptions<unknown>): unknown {
   if (isQuery(value)) {
      const phase = queryMap.get(value)!
      if (value === ContentChildren || value === ViewChildren) {
         const initial = new QueryListValue()
         return new DeferredValueType(initial, phase, { initial })
      }
      return new ValueType(options, void 0, phase)
   }
   if (
      isValue(value) ||
      (typeof value === "function" && !isEmitter(value) && !isClass(value))
   ) {
      return new EmitterType(value)
   }
   if (isObservable(value)) {
      return new DeferredValueType(value, 5, options)
   }
   return new ValueType(options, value, 5)
}

export function subscribe<T>(): Subscription
export function subscribe<T>(observer: () => void): Subscription
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
   observer: (value: T) => void,
): Subscription
export function subscribe<T>(
   source: Observable<T>,
   signal: UnsubscribeSignal,
): Subscription
export function subscribe<T>(
   source: Observable<T>,
   observer: PartialObserver<T>,
   signal: UnsubscribeSignal,
): Subscription
export function subscribe<T>(
   source: Observable<T>,
   observer: (value: T) => TeardownLogic,
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
export function listen<T>(subject: NextObserver<T>): Emitter<T>
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
   value: ReadonlyValue<any>,
   handler?: (error: unknown, state: ErrorState) => Observable<any> | void,
): Value<ErrorState | void> {
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
      const result = handler?.(e, state)
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
   return error as any
}

export function pipe<T>(source: T): DeferredValue<T>
export function pipe<T, A>(source: T, fn1: UnaryFunction<T, A>): A
export function pipe<T, A, B>(
   source: T,
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
): B
export function pipe<T, A, B, C>(
   source: T,
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
): C
export function pipe<T, A, B, C, D>(
   source: T,
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
   fn4: UnaryFunction<C, D>,
): D
export function pipe<T, A, B, C, D, E>(
   source: T,
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
   fn4: UnaryFunction<C, D>,
   fn5: UnaryFunction<D, E>,
): E
export function pipe<T, A, B, C, D, E, F>(
   source: T,
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
   fn4: UnaryFunction<C, D>,
   fn5: UnaryFunction<D, E>,
   fn6: UnaryFunction<E, F>,
): F
export function pipe<T, A, B, C, D, E, F, G>(
   source: T,
   fn1: UnaryFunction<T, A>,
   fn2: UnaryFunction<A, B>,
   fn3: UnaryFunction<B, C>,
   fn4: UnaryFunction<C, D>,
   fn5: UnaryFunction<D, E>,
   fn6: UnaryFunction<E, F>,
   fn7: UnaryFunction<F, G>,
): G
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
): H
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
): I
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
   ...fns: UnaryFunction<any, any>[]
): unknown
export function pipe(...args: any[]): unknown {
   return (<any>args[0]).pipe(...args.slice(1))
}
export function share<T>(): UnaryFunction<Observable<T>, DeferredValue<T>>
export function share<T>(
   options: ValueOptions<T>,
): UnaryFunction<Observable<T>, DeferredValue<T>>
export function share<T>(
   options: DeferredValueOptions<T>,
): UnaryFunction<Observable<T>, Value<T>>
export function share(
   options?: ValueOptions<unknown> | DeferredValueOptions<unknown>,
): UnaryFunction<Observable<unknown>, unknown> {
   return function (source) {
      return use(source, options)
   }
}
