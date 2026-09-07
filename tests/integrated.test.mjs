import test from 'node:test';
import assert from 'node:assert/strict';
import { PILOT_LESSONS, FRAMEWORK, KNOWLEDGE_MAP, PILOT_MATERIALS, pilotAudioTexts } from '../data/integrated-course.js';
import { VOCAB } from '../data/vocab.js';
import { GRAMMAR_LESSONS } from '../data/grammar.js';
const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};globalThis.window={dispatchEvent(){}};
const storage=await import('../js/storage.js?v=4');
const learn=await import('../js/integrated.js');
const {rate,markKnown,buildQueue}=await import('../js/srs.js?v=4');

test('12 unit framework, 8 isolated lessons, stable IDs and valid dependencies',()=>{
 assert.equal(FRAMEWORK.length,12);assert.equal(PILOT_LESSONS.length,8);assert.equal(PILOT_MATERIALS.length,4);
 const seen=new Set();for(const l of PILOT_LESSONS){assert(!seen.has(l.id));l.needs.forEach(id=>assert(seen.has(id)));seen.add(l.id);
 assert(l.words.length>=4&&l.words.length<=6);l.words.forEach(id=>assert(VOCAB.some(w=>w.id===id),id));l.grammarRefs.forEach(id=>assert(GRAMMAR_LESSONS.some(g=>g.id===id),id));
 assert.equal(new Set(l.activities.map(a=>a.id)).size,l.activities.length);assert(l.activities.every(a=>a.target));assert.equal(l.reviews.length,3);assert(l.reviews.every(a=>a.id&&a.target));}
 for(const k of KNOWLEDGE_MAP){assert(seen.has(k.first));assert(k.revisit.every(id=>seen.has(id)));assert(seen.has(k.check));}
 assert(pilotAudioTexts().length>70);
});
test('new default is 5; returning users retain old default or chosen quota',()=>{
 data.clear();storage.migrate();assert.equal(storage.getSettings().newPerDay,5);
 data.clear();data.set('md.meta.v1',JSON.stringify({schemaVersion:3}));data.set('md.lessons.v1','{}');storage.migrate();assert.equal(storage.getSettings().newPerDay,10);
 data.clear();data.set('md.settings.v1',JSON.stringify({newPerDay:7}));storage.migrate();assert.equal(storage.getSettings().newPerDay,7);
});
test('shared quota survives repeated sessions and duplicate IDs',()=>{
 data.clear();for(let i=1;i<=5;i++)assert(rate(`w00${i}`,'good'));
 assert.equal(storage.newWordRemaining(),0);assert.equal(rate('w006','good'),null);assert.equal(buildQueue(['w006','w006']).fresh.length,0);
 assert(rate('w001','good'));assert.equal(storage.loadWordLearning().days[storage.todayKey()].length,5);
});
test('word evidence uses one scheduling event across three modes, and is idempotent',()=>{
 data.clear();['text','listening','recall'].forEach(mode=>learn.recordWord('w001',mode,true,`session:1:w001:${mode}`));
 assert.equal(storage.loadSrs().w001.reps,1);assert.equal(storage.newWordRemaining(),4);assert(learn.wordKnown('w001'));
 learn.recordWord('w001','text',true,'session:1:w001:text');assert.equal(storage.loadWordLearning().evidence.w001.text.seen,1);
});
test('lookup alone does not learn a word; exact built-in lemma shares evidence',()=>{
 data.clear();storage.addWordEntry({lemma:'Hallo',zh:'你好'});assert.deepEqual(storage.loadSrs(),{});assert.equal(learn.canonicalWordId('d:Hallo'),'w001');
 learn.recordWord('d:Hallo','text',true,'lookup-practice');assert(storage.loadSrs().w001);assert(!storage.loadSrs()['d:Hallo']);
});
test('mark known schedules a short check rather than six months',()=>{data.clear();markKnown('w001');assert.equal(storage.loadSrs().w001.ivl,3);});
test('resume preserves draft, hints and attempts; old completion never unlocks new lessons',()=>{
 data.clear();data.set('md.lessons.v1',JSON.stringify({u1l1:{done:true}}));const l=PILOT_LESSONS[0];assert.equal(learn.nextPilot().id,l.id);
 learn.saveActivity(l,'transfer',{draft:'Ich heiße',attempts:1,hinted:true,correct:false});learn.updateProgress(l,{position:4});
 const p=learn.lessonProgress(l);assert.equal(p.position,4);assert.equal(p.answers.transfer.draft,'Ich heiße');assert(p.answers.transfer.hinted);assert(!learn.canOpen(PILOT_LESSONS[1]));
 learn.completeLesson(l);assert(learn.canOpen(PILOT_LESSONS[1]));assert(!learn.lessonProgress(l).independentPassed);
});
test('completion and review are idempotent; delayed check uses real scheduled dates and a new example',()=>{
 data.clear();const l=PILOT_LESSONS[0];learn.completeLesson(l);const at=learn.lessonProgress(l).completedAt;learn.completeLesson(l);assert.equal(learn.lessonProgress(l).completedAt,at);
 assert.equal(learn.dueReviews().length,0);const initial=learn.dueReviews(3,storage.loadIntegrated(),Date.now()+86400001)[0];assert(initial);
 const key=learn.lessonKey(l);learn.submitReview(key,false,'r1');const r=storage.loadIntegrated().reviews[key];assert.equal(r.stage,0);assert.equal(r.attempt,1);
 learn.submitReview(key,false,'r1');assert.equal(storage.loadIntegrated().reviews[key].attempt,1);
 const next=learn.dueReviews(3,storage.loadIntegrated(),Date.now()+86400001)[0];assert.notEqual(next.activity.id,initial.activity.id);
 ['r2','r3','r4'].forEach(id=>learn.submitReview(key,true,id));assert(storage.loadIntegrated().reviews[key].done);
});
test('backup round trip retains old and new stores without converting old mastery',()=>{
 data.clear();storage.saveSrs({w001:{due:1,reps:2}});learn.saveActivity(PILOT_LESSONS[0],'transfer',{draft:'Ich heiße Mia.'});learn.recordWord('w001','text',true,'once');const exported=storage.exportAll();data.clear();storage.importAll(exported);
 assert.equal(learn.lessonProgress(PILOT_LESSONS[0]).answers.transfer.draft,'Ich heiße Mia.');assert.equal(storage.loadWordLearning().evidence.w001.text.seen,1);assert(storage.loadSrs().w001);assert(!learn.lessonProgress(PILOT_LESSONS[0]).done);
});
test('content versions isolate progress and stale delayed reviews',()=>{
 data.clear();const l=PILOT_LESSONS[0];learn.completeLesson({...l,version:0});assert(!learn.lessonProgress(l).done);assert.equal(learn.dueReviews(99,storage.loadIntegrated(),Date.now()+864000001).length,0);
});
test('punctuation/case normalization accepts equivalent answers without guessing different expressions',()=>{
 const a={type:'response',answers:['Ich heiße Mia.']};assert(learn.checkAnswer(a,' ich HEIßE Mia! '));assert(!learn.checkAnswer(a,'Ich heiße Anna.'));
});

test('existing dictionary card is reused by curriculum without a duplicate built-in card',()=>{
 data.clear();storage.addWordEntry({lemma:'Hallo',zh:'你好'});storage.saveSrs({'d:Hallo':{due:1,reps:2,ivl:3,ef:2.5}});
 assert.equal(learn.canonicalWordId('w001'),'d:Hallo');assert.deepEqual(learn.wordQueue(['w001','d:Hallo'],{reviewOnly:true}),['d:Hallo']);
 learn.recordWord('w001','text',true,'legacy');assert(!storage.loadSrs().w001);assert(storage.loadWordLearning().evidence['d:Hallo']);
});
test('quota overflow retains pending evidence and enters practice after a new day',()=>{
 data.clear();for(let i=1;i<=5;i++)learn.recordWord(`w00${i}`,'text',true,`day1:${i}`);
 assert.equal(learn.recordWord('w006','text',true,'day1:6').enrolled,false);assert(storage.loadWordLearning().evidence.w006.pending);
 const ledger=storage.loadWordLearning();ledger.days={};storage.saveWordLearning(ledger);
 assert.equal(learn.wordQueue(['w020'])[0],'w006');learn.recordWord('w006','text',true,'day2:6');assert(!storage.loadWordLearning().evidence.w006.pending);assert.equal(storage.newWordRemaining(),4);
});
test('a lesson never schedules more than three opening reviews; hinted work is not independent',()=>{
 data.clear();for(const l of PILOT_LESSONS){for(const a of l.checks)learn.saveActivity(l,a.id,{correct:true,attempts:1,hinted:a.id==='transfer'});learn.completeLesson(l);}
 assert.equal(learn.dueReviews(3,storage.loadIntegrated(),Date.now()+86400001).length,3);
 assert(!learn.lessonProgress(PILOT_LESSONS[0]).independentPassed);
});
test('sync round trip carries new sessions, wordbook and prior course progress together',()=>{
 data.clear();storage.addWordEntry({lemma:'Hallo',zh:'你好'});learn.recordWord('w001','recall',true,'sync');learn.sessionSave('words:current',{position:1,items:[{id:'w001',mode:'recall'}],answers:{},done:false});learn.saveActivity(PILOT_LESSONS[0],'transfer',{draft:'Ich heiße Mia.'});
 const payload=storage.exportAll();data.clear();assert.equal(storage.mergeRemote(payload),'pulled');assert(storage.getWordbook()['d:Hallo']);assert.equal(learn.sessionGet('words:current').position,1);assert.equal(storage.loadWordLearning().evidence.w001.recall.seen,1);assert.equal(learn.lessonProgress(PILOT_LESSONS[0]).answers.transfer.draft,'Ich heiße Mia.');
});
test('every pilot audio and vocabulary audio reference exists on disk',async()=>{
 const {AUDIO_MANIFEST}=await import('../data/audio-manifest.js');const {existsSync,statSync}=await import('node:fs');
 const words=[...new Set(PILOT_LESSONS.flatMap(l=>l.words))].map(id=>VOCAB.find(w=>w.id===id)).map(w=>w.art?`${w.art} ${w.de}`:w.de);
 for(const text of [...pilotAudioTexts(),...words]){const file=AUDIO_MANIFEST[text.trim()];assert(file,`missing manifest: ${text}`);const path=new URL('../audio/'+file,import.meta.url);assert(existsSync(path));assert(statSync(path).size>100);}
});
test('legacy mistake cards never consume or get blocked by the vocabulary quota',()=>{
 data.clear();for(let i=1;i<=5;i++)rate(`w00${i}`,'good');assert(rate('m:legacy:1','again'));assert.equal(storage.loadWordLearning().days[storage.todayKey()].length,5);
});
test('importing an old backup preserves its implicit ten-word preference',()=>{
 data.clear();storage.migrate();storage.importAll(JSON.stringify({meta:{schemaVersion:3},settings:{theme:'light'}}));assert.equal(storage.getSettings().newPerDay,10);
});
test('later recall failure shortens a successful recognition schedule without double repetitions',()=>{
 data.clear();storage.saveSrs({w001:{due:1,reps:8,ivl:20,ease:2.5,lapses:0,state:'review'}});
 learn.recordWord('w001','text',true,'s:w001:text');learn.recordWord('w001','recall',false,'s:w001:recall');const card=storage.loadSrs().w001;
 assert.equal(card.reps,9);assert.equal(card.lapses,1);assert.equal(card.state,'learn');assert(card.due<=Date.now()+86400000);
});
