import test from 'node:test';
import assert from 'node:assert/strict';
import { TEXT_LESSONS } from '../data/text-lessons.js';
import { VOCAB } from '../data/vocab.js';
const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};globalThis.window={dispatchEvent(){}};
const t=await import('../js/text-lesson.js');
const DAY=86400000;
const tokens=s=>s.match(/[A-Za-zÄÖÜäöüß]+/g).map(w=>w.toLocaleLowerCase('de-DE'));

test('课文数据：下标有效、词在词库、原句能出填空、释义覆盖每个词',()=>{
 for(const l of TEXT_LESSONS){
  const n=l.lines.length;const words=l.lines.reduce((sum,x)=>sum+tokens(x.de).length,0);
  assert(words>=30&&words<=80,`${l.id} 有 ${words} 词`);
  assert(l.lines.some(x=>x.who===l.role));
  [...l.dictation,...l.shadow,...l.cards.map(c=>c.after),...l.words.map(w=>w.line)].forEach(i=>assert(i>=0&&i<n,`${l.id} 下标 ${i}`));
  l.shadow.forEach(i=>assert.equal(l.lines[i].who,l.role));
  for(const w of l.words){assert(VOCAB.some(v=>v.id===w.id),w.id);assert(l.lines[w.line].de.includes(w.form),`${w.form} 不在第 ${w.line} 句`);}
  for(const x of [...l.lines,...l.reading.lines])tokens(x.de).forEach(tok=>assert(l.gloss[tok],`${l.id} 缺释义：${tok}`));
  assert.equal(l.cards.filter(c=>c.kind==='grammar').length,1);assert.equal(l.cards.filter(c=>c.kind==='pron').length,1);
  assert.equal(l.reviews.length,3);[l.gist,...l.checks,l.reading.question].forEach(c=>assert(c.answer<c.options.length));
 }
});

test('课后小材料只用本课课文里出现过的词（人名除外）',()=>{
 for(const l of TEXT_LESSONS){const known=new Set(l.lines.flatMap(x=>tokens(x.de)));
  l.reading.lines.flatMap(x=>tokens(x.de)).filter(w=>l.gloss[w]!=='人名').forEach(w=>assert(known.has(w),`${l.id} 小材料用了没教的词：${w}`));}
});

test('首页一个按钮：第 1 天 → 当天休息 → 次日第 2 天 → 学完当天休息',()=>{
 data.clear();const l=TEXT_LESSONS[0];const day1=new Date(2026,9,21,9).getTime();
 assert.deepEqual([t.todayStep(undefined,day1).kind,t.todayStep(undefined,day1).day],['day',1]);
 t.completeDay(l,1,day1);
 const rest=t.todayStep(undefined,day1+3600000);assert.equal(rest.kind,'rest');assert.equal(rest.next.day,2);
 const next=t.todayStep(undefined,day1+DAY);assert.equal(next.kind,'day');assert.equal(next.day,2);
 t.completeDay(l,2,day1+DAY);
 const after=t.todayStep(undefined,day1+DAY+3600000);
 assert.equal(after.kind,TEXT_LESSONS.length>1?'rest':'caughtUp');
 t.completeDay(l,2,day1+5*DAY);assert.equal(t.textProgress(l).d2,t.dayKey(day1+DAY),'重复完成不改日期');
});

test('隔天检查：学完 2 天后到期；首次做对才推进，两次通过算记住了；做错次日再来',()=>{
 data.clear();const l=TEXT_LESSONS[0];const now=new Date(2026,9,21,9).getTime();
 t.completeDay(l,1,now);t.completeDay(l,2,now+DAY);
 assert.equal(t.dueTextReviews(undefined,now+2*DAY).length,0);
 const [r]=t.dueTextReviews(undefined,now+3*DAY);assert(r);
 const first=t.reviewActivity(r);t.submitTextReview(r.key,false,now+3*DAY);
 assert.equal(t.dueTextReviews(undefined,now+3*DAY+3600000).length,0);
 const [again]=t.dueTextReviews(undefined,now+4*DAY);assert.notEqual(t.reviewActivity(again).id,first.id,'换一道变式');
 t.submitTextReview(again.key,true,now+4*DAY);assert(!t.remembered(l));
 assert.equal(t.dueTextReviews(undefined,now+7*DAY).length,0);
 const [last]=t.dueTextReviews(undefined,now+8*DAY);t.submitTextReview(last.key,true,now+8*DAY);
 assert(t.remembered(l));assert.equal(t.dueTextReviews(undefined,now+30*DAY).length,0);
});

test('学过第 1 天的课文，词才进入复习范围',()=>{
 data.clear();const l=TEXT_LESSONS[0];assert.equal(t.studiedTextWords().length,0);
 t.completeDay(l,1);assert.equal(t.studiedTextWords().length,l.words.length);
});
