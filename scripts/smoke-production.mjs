import assert from "node:assert/strict";

const phase=process.argv[2];
if(!["api","web"].includes(phase)){
  console.error("Usage: node scripts/smoke-production.mjs api|web");
  process.exit(2);
}
const apiOrigin=process.env.SMOKE_API_ORIGIN ??
  "https://food-ingredients-api.osohoo691016.workers.dev";
const webOrigin=process.env.SMOKE_WEB_ORIGIN ??
  "https://food-ingredients-web.osohoo691016.workers.dev";

function safeBase(raw){
  const url=new URL(raw);
  assert.equal(url.protocol,"https:","Smoke checks require HTTPS");
  assert.equal(url.username,"");
  assert.equal(url.password,"");
  return url.origin;
}
const api=safeBase(apiOrigin),web=safeBase(webOrigin);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function request(base,path){
  let lastError;
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const response=await fetch(new URL(path,base),{
        cache:"no-store",
        headers:{Accept:path.startsWith("/health")||path.startsWith("/recipes")||path.startsWith("/cuisines")
          ?"application/json":"text/html"},
        signal:AbortSignal.timeout(12000),
      });
      if(!response.ok)throw new Error(`${path}: HTTP ${response.status}`);
      return response;
    }catch(error){
      lastError=error;
      if(attempt<3)await pause(1500);
    }
  }
  throw lastError;
}
async function checkApi(){
  const ready=await request(api,"/health/ready");
  const status=await ready.json();
  assert.equal(status.ok,true,"API readiness returned not ready");
  assert.equal(status.database,"ready");
  assert.equal(ready.headers.get("x-content-type-options"),"nosniff");

  const recipes=await (await request(api,"/recipes?page_size=1")).json();
  assert.ok(Array.isArray(recipes.recipes),"Recipes endpoint returned invalid JSON shape");

  const cuisines=await (await request(api,"/cuisines")).json();
  assert.ok(Array.isArray(cuisines.cuisines),"Cuisines endpoint returned invalid JSON shape");

  const invalid=await fetch(new URL("/auth/me",api),{cache:"no-store",signal:AbortSignal.timeout(12000)});
  assert.equal(invalid.status,401,"Unauthenticated account lookup must reject access");
  console.log("API release smoke passed: schema, secrets, recipes, cuisines, unauthorized request");
}
async function checkWeb(){
  for(const path of ["/","/search","/pantry","/plan","/login"]){
    const response=await request(web,path);
    assert.match(response.headers.get("content-type")??"",/text\/html/i,`${path} is not HTML`);
    const body=await response.text();
    assert.ok(body.includes("<html") && body.length>1000,`${path} returned an incomplete page`);
  }
  console.log("Web release smoke passed: home, search, pantry, planner, login");
}
await (phase==="api"?checkApi():checkWeb());
