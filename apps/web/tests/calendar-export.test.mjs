import test from "node:test";
import assert from "node:assert/strict";
import {buildWeeklyPlanIcs} from "../lib/mealCalendarExport.ts";
test("exports all-day meals across a month boundary",()=>{
  const text=buildWeeklyPlanIcs("2026-11-30",{"0|dinner":"r1","1|lunch":"r2"},
    {"r1":"Ногоотой шөл","r2":"Rice"},new Date("2026-11-14T00:00:00Z"));
  assert.match(text,/DTSTART;VALUE=DATE:20261130/);
  assert.match(text,/DTEND;VALUE=DATE:20261201/);
  assert.match(text,/DTSTART;VALUE=DATE:20261201/);
  assert.equal((text.match(/BEGIN:VEVENT/g)||[]).length,2);
  assert.ok(text.endsWith("\r\n"));
});
test("unsafe titles are escaped and long Cyrillic lines are folded by UTF-8 bytes",()=>{
  const title="Монгол".repeat(40)+";danger,comma\nBEGIN:VEVENT";
  const text=buildWeeklyPlanIcs("2026-11-09",{"0|dinner":"r1","7|dinner":"bad"},
    {r1:title},new Date("2026-11-14T00:00:00Z"));
  assert.equal((text.match(/BEGIN:VEVENT/g)||[]).length,1);
  assert.match(text,/\\;danger\\,comma\\nBEGIN:VEVENT/);
  for(const line of text.split("\r\n").filter(Boolean)){
    assert.ok(new TextEncoder().encode(line).length<=75,line.slice(0,40));
  }
});
