/** Decode a small JSON request without trusting Content-Length or buffering without limits. */
export type JsonReadResult =
  | { ok: true; value: unknown }
  | { ok: false; error: "invalid_json" | "payload_too_large" };

export async function readBoundedJson(
  body: ReadableStream<Uint8Array> | null,
  maxBytes = 64 * 1024,
): Promise<JsonReadResult> {
  if (!body) return { ok:false, error:"invalid_json" };
  const reader=body.getReader();
  const parts:Uint8Array[]=[];
  let size=0;
  try {
    while (true) {
      const {done,value}=await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) return {ok:false,error:"invalid_json"};
      size+=value.byteLength;
      if (size>maxBytes) {
        await reader.cancel().catch(()=>{});
        return {ok:false,error:"payload_too_large"};
      }
      parts.push(value);
    }
  } catch {
    return {ok:false,error:"invalid_json"};
  } finally {
    reader.releaseLock();
  }
  if (!size) return {ok:false,error:"invalid_json"};
  const bytes=new Uint8Array(size);
  let pos=0;
  for (const p of parts) {bytes.set(p,pos);pos+=p.byteLength;}
  try {
    return {ok:true,value:JSON.parse(new TextDecoder("utf-8",{fatal:true,ignoreBOM:false}).decode(bytes)) as unknown};
  } catch {
    return {ok:false,error:"invalid_json"};
  }
}
