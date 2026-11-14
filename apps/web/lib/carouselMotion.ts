/** Autoplay is optional; never slide while the user is interacting. */
export function shouldAutoplayCarousel(state:{
  slides:number;visible:boolean;reducedMotion:boolean;
  hovering:boolean;focused:boolean;now:number;lastInteraction:number;
}):boolean {
  return state.slides>1 && state.visible && !state.reducedMotion &&
    !state.hovering && !state.focused &&
    Number.isFinite(state.now) && Number.isFinite(state.lastInteraction) &&
    state.now-state.lastInteraction>=15_000;
}
