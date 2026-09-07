// Pure curriculum decisions + persistent evidence. No microphone/AI result unlocks lessons.
import { PILOT_LESSONS, CONTENT_VERSION, findPilotLesson } from '../data/integrated-course.js';
import { VOCAB } from '../data/vocab.js';
import { loadIntegrated, saveIntegrated, loadWordLearning, saveWordLearning, loadSrs, saveSrs, getWordbook, newWordRemaining, logActivity } from './storage.js?v=4';
import { rate } from './srs.js?v=4';
const DAY=86400000;
export const normalizeAnswer = value => String(value||'').normalize('NFC').toLocaleLowerCase('de-DE').replace(/[.,!?;:]/g,'').replace(/\s+/g,' ').trim();
export const checkAnswer = (activity,value) => activity.type==='choice' ? Number(value)===activity.answer : (activity.answers||[]).some(a=>normalizeAnswer(a)===normalizeAnswer(value));
export const lessonKey = lesson => `${lesson.id}@${lesson.version}`;
export function lessonProgress(lesson, data=loadIntegrated()) {return data.lessons?.[lessonKey(lesson)] || {position:0,answers:{},done:false};}
export function nextPilot(data=loadIntegrated()) {return PILOT_LESSONS.find(l=>!lessonProgress(l,data).done)||null;}
export function canOpen(lesson,data=loadIntegrated()) {return lesson.needs.every(id=>lessonProgress(findPilotLesson(id),data).done);}
export function updateProgress(lesson, patch) {
 const data=loadIntegrated();data.lessons ||= {};
 data.lessons[lessonKey(lesson)]={...lessonProgress(lesson,data),...patch,version:lesson.version,updatedAt:Date.now()};
 saveIntegrated(data);return data.lessons[lessonKey(lesson)];
}
export function saveActivity(lesson, id, patch) {
 const p=lessonProgress(lesson); const previous=p.answers[id]||{};
 return updateProgress(lesson,{answers:{...p.answers,[id]:{...previous,...patch}}});
}
export function canonicalWordId(id) {
 const book=getWordbook(),srs=loadSrs();
 if(!id?.startsWith('d:')) {
  const word=VOCAB.find(w=>w.id===id),saved=word&&book[`d:${word.de}`];
  if(saved&&(!saved.art||saved.art===word.art)&&srs[`d:${word.de}`]&&!srs[id])return `d:${word.de}`;
  return id;
 }
 const entry=book[id];if(!entry)return id;
 const candidates=VOCAB.filter(w=>w.de===entry.lemma&&(!entry.art||w.art===entry.art));
 if(candidates.length!==1)return id;
 return srs[id]&&!srs[candidates[0].id]?id:candidates[0].id;
}
export function wordFor(id) {
 const canonical=canonicalWordId(id);const word=VOCAB.find(w=>w.id===canonical);
 if(word)return word;
 const book=getWordbook()[canonical];return book?{...book,id:canonical,de:book.lemma,zh:book.zh}:null;
}
export function recordWord(id, mode, correct, eventId) {
 id=canonicalWordId(id);let ledger=loadWordLearning();ledger.events ||= {};ledger.evidence ||= {};ledger.scheduled ||= {};
 if(ledger.events[eventId])return ledger.events[eventId];
 const existing=loadSrs()[id];
 const scheduleKey=eventId.replace(/:(text|listening|recall)$/, '');
 const card=ledger.scheduled?.[scheduleKey] ? loadSrs()[id] : rate(id,correct?'good':'again');
 // SRS writes the shared daily ledger; reload it before adding evidence.
 ledger=loadWordLearning();ledger.events ||= {};ledger.evidence ||= {};ledger.scheduled ||= {};
 if(card){
  const scheduled=ledger.scheduled[scheduleKey];
  // Later recall/listening failure must shorten this word's next review without
  // counting another scheduling repetition in the same session.
  if(scheduled&&!correct&&!scheduled.failed){const cards=loadSrs();cards[id]={...cards[id],state:'learn',step:0,ivl:0,lapses:(cards[id].lapses||0)+1,due:Math.min(cards[id].due,Date.now()+DAY)};saveSrs(cards);}
  ledger.scheduled[scheduleKey]={failed:!!scheduled?.failed||!correct};
 }
 const previous=ledger.evidence[id]||{};const evidence=previous[mode]||{seen:0,correct:0};
 ledger.evidence[id]={...previous,[mode]:{seen:evidence.seen+1,correct:evidence.correct+(correct?1:0),last:Date.now(),lastCorrect:correct},pending:!card};
 const result={enrolled:!!card,correct,mode,at:Date.now(),wasKnown:!!existing};ledger.events[eventId]=result;
 saveWordLearning(ledger);return result;
}
export function wordKnown(id) {
 const e=loadWordLearning().evidence?.[canonicalWordId(id)];
 return !!(e?.text?.lastCorrect&&e?.listening?.lastCorrect&&e?.recall?.lastCorrect);
}
export function currentWords() {return (nextPilot()||PILOT_LESSONS.at(-1)).words;}
export function studiedWords() {const d=loadIntegrated();return [...new Set(PILOT_LESSONS.filter(l=>lessonProgress(l,d).done).flatMap(l=>l.words))];}
export function wordQueue(ids,{reviewOnly=false}={}) {
 const srs=loadSrs();const pending=reviewOnly?[]:Object.entries(loadWordLearning().evidence||{}).filter(([,e])=>e.pending).map(([id])=>id);
 const all=[...new Set([...pending,...ids].map(canonicalWordId))];
 const due=all.filter(id=>srs[id]?.due<=Date.now()).sort((a,b)=>srs[a].due-srs[b].due);
 const fresh=reviewOnly?[]:all.filter(id=>!srs[id]).slice(0,newWordRemaining());
 return [...due.slice(0,20),...fresh];
}
export function completeLesson(lesson) {
 const data=loadIntegrated();const p=lessonProgress(lesson,data);if(p.done)return p;
 const independent=lesson.activities.filter(a=>['response','choice'].includes(a.type)&&a.id!=='meaning');
 const independentPassed=independent.length>0&&independent.every(a=>p.answers[a.id]?.correct===true&&!p.answers[a.id]?.hinted&&p.answers[a.id]?.attempts===1);
 data.lessons ||= {};data.reviews ||= {};data.events ||= [];
 data.lessons[lessonKey(lesson)]={...p,done:true,position:lesson.activities.length,independentPassed,completedAt:Date.now(),version:lesson.version};
 data.reviews[lessonKey(lesson)]={lessonId:lesson.id,version:lesson.version,stage:0,due:Date.now()+DAY,attempt:0,done:false};
 data.events.push({kind:'lesson-complete',lessonId:lesson.id,version:lesson.version,at:Date.now(),independentPassed});saveIntegrated(data);
 logActivity({items:independent.length,ok:independent.filter(a=>p.answers[a.id]?.correct).length,lessons:1,completionId:lessonKey(lesson)});
 return data.lessons[lessonKey(lesson)];
}
export function dueReviews(limit=3,data=loadIntegrated(),now=Date.now()) {
 return Object.entries(data.reviews||{}).filter(([key,r])=>r.version===CONTENT_VERSION&&!r.done&&r.due<=now&&findPilotLesson(r.lessonId)).sort((a,b)=>a[1].due-b[1].due).slice(0,limit).map(([key,r])=>({key,...r,activity:findPilotLesson(r.lessonId).reviews[(r.stage+r.attempt)%3]}));
}
export function submitReview(key,correct,eventId) {
 const data=loadIntegrated();data.reviewEvents ||= {};if(data.reviewEvents[eventId])return;
 const r=data.reviews?.[key];if(!r)return;
 data.reviewEvents[eventId]={correct,at:Date.now()};r.attempt++;
 if(correct){r.stage++;r.done=r.stage>=3;r.due=Date.now()+(r.stage===1?2:4)*DAY;}else r.due=Date.now()+DAY;
 r.lastCorrect=correct;r.last=Date.now();saveIntegrated(data);
}
export function sessionGet(key) {return loadIntegrated().sessions?.[key]||null;}
export function sessionSave(key,value) {const data=loadIntegrated();data.sessions ||= {};data.sessions[key]=value;saveIntegrated(data);}
export function logTrial(kind,details={}) {const data=loadIntegrated();data.events ||= [];data.events.push({kind,...details,at:Date.now()});saveIntegrated(data);}
