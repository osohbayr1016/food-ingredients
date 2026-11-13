import test from "node:test";
import assert from "node:assert/strict";
import { aggregateMealShopping, convertQuantity, mondayOfWeek } from "../lib/mealShopping.ts";

test("mass and volume conversion never assumes density", () => {
  assert.equal(convertQuantity(1,"кг","г"),1000);
  assert.equal(convertQuantity(2,"tbsp","мл"),30);
  assert.equal(convertQuantity(1,"л","г"),null);
  assert.equal(convertQuantity(1,"аяга","мл"),null);
});
test("shopping list accounts for portions and pantry stock once", () => {
  const dishes = [
    {baseServes:2,plannedServes:4,ingredients:[
      {ingredient_canonical_id:"rice",name:"Rice",quantity:200,unit:"г"},
      {ingredient_canonical_id:"eggs",name:"Egg",quantity:2,unit:"ш"},
    ]},
    {baseServes:1,plannedServes:1,ingredients:[
      {ingredient_canonical_id:"rice",name:"Rice",quantity:100,unit:"г"},
    ]},
  ];
  const items = aggregateMealShopping(dishes,[
    {canonical_id:"rice",name:"Rice",quantity:"0.35",unit:"кг"},
    {canonical_id:"eggs",name:"Egg",quantity:"1",unit:"ш"},
  ]);
  assert.equal(items.find(i=>i.name==="Rice")?.quantity,150);
  assert.equal(items.find(i=>i.name==="Egg")?.quantity,3);
});
test("unknown conversion retains item rather than claiming pantry is enough", () => {
  const items = aggregateMealShopping([{baseServes:1,plannedServes:1,ingredients:[
    {ingredient_canonical_id:"flour",name:"Flour",quantity:200,unit:"г"},
  ]}],[{canonical_id:"flour",name:"Flour",quantity:"2",unit:"аяга"}]);
  assert.equal(items.length,1);
  assert.equal(items[0].quantity,200);
  assert.equal(items[0].stockUncertain,true);
});
test("Monday is the beginning of the planned week", () => {
  const d=mondayOfWeek(new Date(2026,10,13)); // Friday
  assert.equal(d.getDay(),1);
  assert.equal(d.getDate(),9);
});
