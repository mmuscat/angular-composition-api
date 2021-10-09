import {
   ContentChild,
   ContentChildren,
   ErrorHandler,
   EventEmitter,
   Injector,
   Type,
   ViewChild,
   ViewChildren,
} from "@angular/core"
import {
   BehaviorSubject,
   Observable,
   Subject,
   Subscribable,
   Subscription,
} from "rxjs"

export const checkPhase = Symbol("checkPhase")

export interface Check {
   check(): void
}

export interface CurrentContext {
   injector: Injector
   error: ErrorHandler
   subscription: Subscription
   effects: EffectObserver<any>[]
   scheduler: any
   0: Set<Check>
   1: Set<Check>
   2: Set<Check>
}

export interface CheckSubject<T> extends Observable<T> {
   readonly value: T
   readonly [checkPhase]: CheckPhase
}

export type CheckPhase = 0 | 1 | 2
export type EffectObserver<T> = Subscribable<T>

export type State<T, U> = Type<
   {
      [key in keyof T]: T[key] extends CheckSubject<infer R> ? R : T[key]
   } &
      {
         [key in keyof U]: U[key] extends CheckSubject<infer R>
            ? R
            : U[key] extends EventEmitter<infer R>
            ? (value: R) => void
            : U[key]
      }
>

export type UnsubscribeSignal = Subscription | AbortSignal | null

export type Value<T> = CheckSubject<T> & {
   readonly __ng_value: true
   readonly source: Observable<T>
   readonly pipe: Observable<T>["pipe"]
   readonly sync: [Value<T>, Emitter<T>]
   readonly value: T
   (mutate: (value: T) => any): void
   (value: T): void
   (): T
   next(value: T): void
}

export interface ReadonlyValue<T> extends CheckSubject<T> {
   readonly __ng_value: true
   readonly source: Observable<T>
   readonly pipe: Observable<T>["pipe"]
   readonly value: T
   (): T
}

export interface Accessor<T, U> {
   next: ((value: U) => void) | Subject<U> | Value<U> | ReadonlyValue<U> | Emitter<U> | AccessorValue<any, U>
   value: Value<T> | ReadonlyValue<T> | AccessorValue<T, any> | BehaviorSubject<T> | (() => T)
}

export type AccessorValue<T, U> = CheckSubject<T> & {
   readonly __ng_value: true
   readonly __ng_accessor_value: true
   readonly source: Observable<T>
   readonly pipe: Observable<T>["pipe"]
   readonly sync: [AccessorValue<T, U>, AccessorEmitter<T, U>]
   readonly value: T
   (mutate: (value: U) => any): void
   (value: U): void
   (): T
   next(value: U): void
}

export interface AccessorEmitter<T, U>
   extends Observable<T> {
   readonly __ng_emitter: true
   readonly source: Observable<T>
   readonly pipe: Observable<T>["pipe"]
   (param: U): void
   next(value: U): void
}

export interface EmitterWithParams<T extends (...args: any[]) => any>
   extends Observable<T> {
   readonly __ng_emitter: true
   readonly source: Observable<ReturnType<T>>
   readonly pipe: Observable<ReturnType<T>>["pipe"]
   (...params: Parameters<T>): void
   next(value: ReturnType<T>): void
}

export interface Emitter<T> extends Observable<T> {
   readonly __ng_emitter: true
   readonly source: Observable<T>
   readonly pipe: Observable<T>["pipe"]
   (value: T): void
   next(value: T): void
}

export type QueryType = typeof ContentChild | typeof ViewChild

export type QueryListType = typeof ViewChildren | typeof ContentChildren
