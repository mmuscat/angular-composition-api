import { Component } from "@angular/core"
import {
   select,
   Service,
   subscribe,
   use,
   ViewDef,
} from "@mmuscat/angular-composition-api"
import { animationFrames } from "rxjs"

function counter() {
   const count = use(0)
   subscribe(animationFrames(), ({ elapsed }) => {
      const seconds = 1 + (Math.floor(elapsed / 1000) % 10)
      if (seconds !== count()) {
         count(seconds)
      }
   })
   return count
}

export const Counter = new Service(counter, {
   providedIn: "root",
})

function triangle() {
   const x = use(0)
   const y = use(0)
   const s = use(0)
   const targetSize = 25
   const halfTargetSize = targetSize / 2
   const halfS = select(() => s() / 2)
   const half2S = select(() => s() / 4)
   const isFinal = select(() => s() < targetSize)

   return {
      x,
      y,
      s,
      targetSize,
      halfTargetSize,
      halfS,
      half2S,
      isFinal,
   }
}

@Component({
   selector: "app-triangle",
   templateUrl: "./triangle.component.html",
   styleUrls: ["./triangle.component.css"],
   inputs: ["x", "y", "s"],
})
export class TriangleComponent extends ViewDef(triangle) {}
