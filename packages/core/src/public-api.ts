/*
 * Public API Surface of angular-composition-api
 */

export { Service, inject, CallContextError, decorate, ViewDef } from "./core"
export {
   use,
   subscribe,
   listen,
   Attribute,
   attribute,
   onError,
   pipe,
} from "./common"
export {
   CheckSubject,
   checkPhase,
   CheckPhase,
   State,
   UnsubscribeSignal,
   Value,
   DeferredValue,
   ReadonlyValue,
   Emitter,
   EmitterWithParams,
   Accessor,
   AccessorValue,
   ExpandValue,
   Change,
} from "./interfaces"
export { select, combine } from "./select"
export { ValueToken, provide, EmptyValueError } from "./provider"
export { onDestroy, onUpdated, onBeforeUpdate, onChanges } from "./lifecycle"
export { ZonelessEventManager } from "./event-manager"
export { isValue, isEmitter, get, access } from "./utils"
