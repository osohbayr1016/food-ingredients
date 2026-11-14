import { MAX_RECIPE_IMAGE_BYTES, supportedImageMime } from "./imageBodyValidation";
/** Legacy R2 direct PUT can only be enabled explicitly and for a bounded exact size. */
export function parsePresignImageRequest(raw:unknown):
  | {ok:true;contentType:"image/jpeg"|"image/png"|"image/webp";sizeBytes:number}
  | {ok:false;error:"unsupported_type"|"invalid_image_size"} {
  if (!raw || typeof raw!=="object" || Array.isArray(raw))return {ok:false,error:"unsupported_type"};
  const body=raw as Record<string,unknown>;
  const ct=supportedImageMime(typeof body.content_type==="string" ? body.content_type : null);
  if(!ct)return {ok:false,error:"unsupported_type"};
  const bytes=body.size_bytes;
  if(typeof bytes!=="number" || !Number.isSafeInteger(bytes) ||
    bytes<1 || bytes>MAX_RECIPE_IMAGE_BYTES)return {ok:false,error:"invalid_image_size"};
  return {ok:true,contentType:ct,sizeBytes:bytes};
}
