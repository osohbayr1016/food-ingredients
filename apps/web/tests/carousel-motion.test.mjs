import test from "node:test";
import assert from "node:assert/strict";
import {shouldAutoplayCarousel} from "../lib/carouselMotion.ts";
const base={slides:4,visible:true,reducedMotion:false,hovering:false,
  focused:false,now:100_000,lastInteraction:0};
test("autoplay stops for reduced motion, hover, focus and recent interaction",()=>{
  assert.equal(shouldAutoplayCarousel(base),true);
  for(const patch of [{slides:1},{visible:false},{reducedMotion:true},
    {hovering:true},{focused:true},{lastInteraction:90_000}])
    assert.equal(shouldAutoplayCarousel({...base,...patch}),false);
  assert.equal(shouldAutoplayCarousel({...base,lastInteraction:85_000}),true);
});
