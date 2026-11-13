export function ServingSlider({
  value, max, onChange,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#e1eade] bg-white p-4" aria-label="Порцын тоо">
    <div>
      <p className="text-sm font-bold text-[#254a35]">Хэдэн хүнд хийх вэ?</p>
      <p className="mt-1 text-xs text-[#6f8074]">Орцын хэмжээ дагаж өөрчлөгдөнө.</p>
    </div>
    <div className="flex shrink-0 items-center gap-2 rounded-xl bg-[#f1f7ee] p-1">
      <button type="button" onClick={() => onChange(Math.max(1,value-1))}
        disabled={value <= 1} aria-label="Порц нэгээр багасгах"
        className="grid h-11 w-11 place-items-center rounded-xl bg-white text-xl font-bold text-[#276440] shadow-sm disabled:cursor-not-allowed disabled:opacity-40">−</button>
      <output aria-live="polite" className="min-w-11 text-center text-base font-extrabold tabular-nums text-[#234a34]">{value}</output>
      <button type="button" onClick={() => onChange(Math.min(max,value+1))}
        disabled={value >= max} aria-label="Порц нэгээр нэмэх"
        className="grid h-11 w-11 place-items-center rounded-xl bg-white text-xl font-bold text-[#276440] shadow-sm disabled:cursor-not-allowed disabled:opacity-40">+</button>
    </div>
  </div>;
}
