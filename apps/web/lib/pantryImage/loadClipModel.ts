/** Separate vision/text ONNX sessions avoid fused CLIP merges that blow up in-browser. */

const MODEL_ID = "Xenova/clip-vit-base-patch32";

export type ClipEmbedBundle = {
  vision_model: import("@xenova/transformers").CLIPVisionModelWithProjection;
  text_model: import("@xenova/transformers").CLIPTextModelWithProjection;
  tokenizer: import("@xenova/transformers").PreTrainedTokenizer;
  processor: import("@xenova/transformers").Processor;
  RawImage: typeof import("@xenova/transformers").RawImage;
};

let clipPromise: Promise<ClipEmbedBundle> | null = null;

export function loadClipModel(): Promise<ClipEmbedBundle> {
  if (!clipPromise) {
    clipPromise = (async () => {
      const mod = await import("@xenova/transformers");
      const [vision_model, text_model, tokenizer, processor] =
        await Promise.all([
          mod.CLIPVisionModelWithProjection.from_pretrained(MODEL_ID),
          mod.CLIPTextModelWithProjection.from_pretrained(MODEL_ID),
          mod.AutoTokenizer.from_pretrained(MODEL_ID),
          mod.AutoProcessor.from_pretrained(MODEL_ID),
        ]);
      return {
        vision_model,
        text_model,
        tokenizer,
        processor,
        RawImage: mod.RawImage,
      };
    })();
  }
  return clipPromise;
}
