export type WebGLContextState='lost'|'restored';
export interface ContextCallbacks {onLost?:()=>void;onRestored?:()=>void;onChange?:(state:WebGLContextState)=>void;}
/** Browser renderer restores resources; World pauses its timeline and recreates render targets. */
export function observeWebGLContext(canvas:HTMLCanvasElement,callbacks:ContextCallbacks):()=>void {
  const lost=(event:Event)=>{event.preventDefault();callbacks.onLost?.();callbacks.onChange?.('lost');};
  const restored=()=>{callbacks.onRestored?.();callbacks.onChange?.('restored');};
  canvas.addEventListener('webglcontextlost',lost,false);canvas.addEventListener('webglcontextrestored',restored,false);
  return()=>{canvas.removeEventListener('webglcontextlost',lost,false);canvas.removeEventListener('webglcontextrestored',restored,false);};
}
