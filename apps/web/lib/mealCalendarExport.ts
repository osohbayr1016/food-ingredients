/** Standalone RFC 5545 all-day calendar export; never sends plan data to a third party. */
const MEALS = {
  breakfast:"Өглөөний цай",lunch:"Өдрийн хоол",dinner:"Оройн хоол",
} as const;
const SLOT=/^([0-6])\|(breakfast|lunch|dinner)$/;
const ID=/^[A-Za-z0-9_-]{1,150}$/;
const encoder=new TextEncoder();

function escapeText(text: string) {
  return text.replace(/\\/g,"\\\\").replace(/\r\n|\r|\n/g,"\\n")
    .replace(/;/g,"\\;").replace(/,/g,"\\,");
}

/** Fold at 75 UTF-8 octets, preserving multibyte Mongolian characters. */
function fold(line: string) {
  const rows: string[]=[];
  let part="",bytes=0;
  for(const point of line){
    const n=encoder.encode(point).length;
    if(bytes+n>75){
      rows.push(part);
      part=" "+point;
      bytes=1+n;
    }else{
      part+=point;
      bytes+=n;
    }
  }
  if(part)rows.push(part);
  return rows.join("\r\n");
}

function toUtcDate(value: string): Date {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error("invalid_week");
  const d=new Date(value+"T00:00:00Z");
  if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value)
    throw Error("invalid_week");
  return d;
}
const dayValue=(d:Date)=>d.toISOString().slice(0,10).replace(/-/g,"");

export function buildWeeklyPlanIcs(
  weekStart:string, plan:Record<string,string>, titles:Record<string,string>,
  now:Date=new Date(),
): string {
  const base=toUtcDate(weekStart);
  const stamp=now.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
  const lines=[
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Food Ingredients//Weekly Meal Planner//MN",
    "CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:Food Ingredients",
  ];
  for(const [key,id] of Object.entries(plan)){
    const match=key.match(SLOT);
    if(!match||!ID.test(id))continue;
    const day=Number(match[1]),meal=match[2] as keyof typeof MEALS;
    const start=new Date(base.getTime()+day*86400000);
    const end=new Date(start.getTime()+86400000);
    const title=(titles[id]||id).slice(0,160);
    lines.push("BEGIN:VEVENT",
      `UID:${weekStart}-${key.replace("|","-")}-${id}@food-ingredients.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dayValue(start)}`,
      `DTEND;VALUE=DATE:${dayValue(end)}`,
      `SUMMARY:${escapeText(`${MEALS[meal]} — ${title}`)}`,
      "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n")+"\r\n";
}
