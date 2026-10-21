import { GRAMMAR_LESSONS } from '../../data/grammar.js';
import { INTEGRATED_WORD_EXAMPLES } from '../../data/word-examples.js?v=2';
import { CONTENT_VERSION, FRAMEWORK, PILOT_LESSONS, PILOT_MATERIALS, PILOT_RELEASE, KNOWLEDGE_MAP, NUMBER_AUDIO, findPilotLesson, pilotAudioTexts } from '../../data/integrated-course.js';
import { VOCAB, THEMES } from '../../data/vocab.js';
import { esc, audioBtn, speakPractice } from '../ui.js?v=2';
import { speak, stopSpeak, resolveFile } from '../speech.js?v=2';
import { loadSrs, getWordbook, loadIntegrated, loadWordLearning, newWordRemaining, getSettings, rewardSummary, getStreak, logActivity } from '../storage.js?v=4';
import { TEXT_LESSONS } from '../../data/text-lessons.js';
import { textProgress, remembered } from '../text-lesson.js';
import { lessonProgress, nextPilot, canOpen, updateProgress, saveActivity, completeLesson, recordWord, currentWords, studiedWords, wordFor, canonicalWordId, wordQueue, dueReviews, submitReview, sessionGet, sessionSave, logTrial, checkAnswer, wordKnown, lessonKey } from '../integrated.js';

// Unlike the legacy single-root helper, preserve explanatory siblings as a group.
function el(html) {
 const template=document.createElement('template');template.innerHTML=html.trim();
 if(template.content.childElementCount===1)return template.content.firstElementChild;
 const group=document.createElement('div');group.append(template.content);return group;
}

let visitCleanup=null;
let recordingCleanup=null;
export function disposePilotView(){visitCleanup?.();visitCleanup=null;recordingCleanup?.();recordingCleanup=null;stopSpeak();}
window.addEventListener('pagehide',disposePilotView);

const button=(text,action,cls='btn')=>{const b=el(`<button class="${cls}" type="button">${esc(text)}</button>`);b.addEventListener('click',action);return b;};
const link=(title,href,sub='')=>el(`<a class="plain-row" href="${esc(href)}"><span>${esc(title)}${sub?`<small>${esc(sub)}</small>`:''}</span><span aria-hidden="true">›</span></a>`);
const head=(host,title,sub='')=>host.appendChild(el(`<header class="plain-head"><h1>${esc(title)}</h1>${sub?`<p>${esc(sub)}</p>`:''}</header>`));
const pronunciationPaused = host=>{head(host,'发音课已暂停');host.appendChild(el('<p>课程中仍可听示范和录音对照。已有学习记录已保留。</p>'));host.appendChild(link('学习参考','#/me'));host.appendChild(link('返回学习','#/'));};
export {pronunciationPaused};
const spoken=w=>w.art?`${w.art} ${w.de}`:w.de;
function audio(host,text){host.appendChild(audioBtn(text));}
export function lines(host,sentences,{hideText=false}={}) {
 let playToken=0;
 const play=async()=>{const token=++playToken;for(const sentence of sentences){if(token!==playToken||!host.isConnected)return;await new Promise(resolve=>{speak(sentence.de,{onend:resolve});});}};
 const controls=el('<div class="plain-actions"></div>');controls.append(button('播放',play));controls.append(button('停止',()=>{playToken++;stopSpeak();},'btn secondary'));host.append(controls);
 const body=el(hideText?'<details><summary>查看原文</summary><div class="material-text"></div></details>':'<div class="material-text"></div>');const target=hideText?body.querySelector('.material-text'):body;
 sentences.forEach(s=>{const row=el(`<div class="plain-sentence"><p class="de">${esc(s.de)}</p><details><summary>释义</summary><p>${esc(s.zh)}</p></details></div>`);row.querySelector('details').addEventListener('toggle',event=>{if(event.target.open)logTrial('translation',{text:s.de});});audio(row,s.de);target.append(row);});host.append(body);
}
export function wordTask(id,mode='text',key='word') {
 const w=wordFor(id);if(!w)return null;
 const distractors=VOCAB.filter(x=>x.id!==w.id&&x.zh!==w.zh&&x.theme===w.theme).slice(0,2);
 while(distractors.length<2){const extra=VOCAB.find(x=>x.id!==w.id&&x.zh!==w.zh&&!distractors.includes(x));if(!extra)break;distractors.push(extra);}
 const options=[w.zh,...distractors.map(x=>x.zh)]; // position varies deterministically by word ID
 const offset=[...w.id].reduce((n,c)=>n+c.charCodeAt(0),0)%options.length;
 const rotated=[...options.slice(offset),...options.slice(0,offset)];
 if(mode==='recall')return {id:key,type:'response',target:'word-recall',prompt:`用德语写出：${w.zh}${w.art?'（带冠词）':''}`,answers:[spoken(w)],wordId:w.id,mode,model:spoken(w)};
 return {id:key,type:'choice',target:`word-${mode}`,prompt:mode==='listening'?'听音，选择词义。':spoken(w),options:rotated,answer:rotated.indexOf(w.zh),audioText:mode==='listening'?spoken(w):null,wordId:w.id,mode,model:spoken(w),explain:`${spoken(w)}：${w.zh}`};
}
/** Persist before advancing. Choice/text answers are objective; oral results remain self-reports. */
export function task(host,a,{state={},patch=()=>{},done=()=>{},attempt=()=>{}}={}) {
 let current={...state};let input;
 const save=p=>{current={...current,...p};patch(current);};
 const render=()=>{
 host.replaceChildren();delete host.dataset.done;
 host.appendChild(el(`<h2 class="task-title">${esc(a.prompt)}</h2>`));
 if(a.audioText)audio(host,a.audioText);
 if(a.type==='choice'){
 const opts=el('<div class="plain-options"></div>');a.options.forEach((text,i)=>opts.append(button(text,()=>submit(i),'btn secondary')));host.append(opts);
 if(current.final)opts.querySelectorAll('button').forEach(b=>b.disabled=true);
 }else{
 input=el('<textarea class="plain-answer" rows="3" aria-label="德语回答" autocapitalize="sentences" spellcheck="false"></textarea>');input.value=current.draft||'';
 input.addEventListener('input',()=>save({draft:input.value}));host.append(input);
 if(!current.final)host.append(button('检查',()=>{if(input.value.trim())submit(input.value);}));else input.disabled=true;
 }
 if(current.attempts||current.hinted||current.skipped){
 const feedback=el(`<div class="plain-feedback" role="status">${current.correct?'正确':current.skipped?'已留待练习':current.final?'参考答案':current.attempts?'再试一次':'提示'}<p>${esc(a.explain||'')}</p></div>`);
 // 第一次答错只给提示，答案留到最后一次或主动看提示时再显示，重试才不是照抄
 if((current.final&&!current.correct)||current.hinted)feedback.append(el(`<p class="de">${esc(a.model||(a.answers||[])[0]||a.options?.[a.answer]||'')}</p>`));host.append(feedback);
 }
 if(current.final){host.append(button('继续',()=>done(current)));return;}
 const actions=el('<div class="plain-actions"></div>');
 actions.append(button('提示',()=>{save({hinted:true});logTrial('hint',{activity:a.id});render();},'btn secondary'));
 actions.append(button('稍后再练',()=>{save({final:true,skipped:true,correct:false});render();},'btn secondary'));host.append(actions);
 };
 const submit=value=>{
 if(current.final)return;const correct=checkAnswer(a,value);const tries=(current.attempts||0)+1;
 save({draft:String(value),attempts:tries,correct,firstCorrect:tries===1?correct:current.firstCorrect,final:correct||tries>=2});
 if(tries===1)attempt(correct,current);render();
 };
 render();
}

export function renderStudy(host) {
 const next=nextPilot();head(host,'学习',PILOT_RELEASE.status==='preview'?'试学版':'');
 if(next){const p=lessonProgress(next);const unit=FRAMEWORK.find(u=>u.id===next.unit);
 const card=el(`<section class="study-current"><p class="plain-muted">${esc(unit.title)}</p><h2>${esc(next.title)}</h2><p class="plain-muted">约 10–15 分钟</p><a class="btn" href="#/learn/${next.id}">${p.position?'继续课程':PILOT_RELEASE.status==='preview'?'试学课程':'开始课程'}</a></section>`);host.append(card);
 }else host.append(el('<section class="study-current"><h2>两个单元已学完</h2><p>可以复习，或阅读、听取新的材料。</p></section>'));
 const reviews=dueReviews(99);if(reviews.length)host.append(link(`课程复习 · ${reviews.length}`,'#/learn-review','每次最多 3 项'));
 const due=Object.entries(loadSrs()).filter(([id,x])=>/^(w|d:)/.test(id)&&x.due<=Date.now()).length;host.append(link(`单词复习 · ${due}`,'#/vocab'));
 host.append(el('<h2 class="section-title">课程</h2>'));
 for(const unit of FRAMEWORK){
 if(!unit.lessons.length)continue;
 const section=el(`<details class="unit-list"${next?.unit===unit.id?' open':''}><summary>${esc(unit.title)}</summary></details>`);
 for(const id of unit.lessons){const l=findPilotLesson(id),p=lessonProgress(l);section.append(canOpen(l)?link(l.title,`#/learn/${id}`,p.done?(p.independentPassed?'已学习 · 独立检查通过':'已学习 · 可继续巩固'):''):el(`<div class="plain-row muted">${esc(l.title)}<small>先完成上一课</small></div>`));}host.append(section);
 }
 const future=el('<details><summary>后续课程</summary></details>');FRAMEWORK.filter(u=>!u.lessons.length).forEach(u=>future.append(el(`<div class="plain-row muted"><span>${esc(u.title)}<small>${esc(u.stage)}</small></span><small>待编写</small></div>`)));host.append(future);
 host.append(link('知识覆盖','#/coverage'));
 optionalAI(host,[...PILOT_LESSONS].reverse().find(l=>lessonProgress(l).done)||PILOT_LESSONS[0]);
}

export function renderPilotLesson(host,id,expressionOnly=false) {
 const lesson=findPilotLesson(id);if(!lesson){head(host,'未找到课程');return;}
 if(!canOpen(lesson)){head(host,'先完成上一课');host.append(link('返回学习','#/'));return;}
 let progress=lessonProgress(lesson);
 if(progress.done&&!expressionOnly){renderCompletion();return;}
 // Freeze at most three due reviews once for this lesson, persist unfinished review session.
 if(!progress.reviewStarted){updateProgress(lesson,{reviewStarted:true,reviewKeys:dueReviews(3).map(r=>r.key)});progress=lessonProgress(lesson);}
 if(!progress.reviewFinished&&progress.reviewKeys?.length){runReview(host,`before:${lessonKey(lesson)}`,progress.reviewKeys,()=>{updateProgress(lesson,{reviewFinished:true});renderPilotLesson(host,id);});return;}
 const opened=Date.now();logTrial('lesson-open',{lessonId:id});
 let timed=false;const time=()=>{if(!timed){timed=true;logTrial('study-time',{lessonId:id,milliseconds:Math.min(Date.now()-opened,30*60*1000)});}};
 visitCleanup=time;
 host.append(link('返回学习','#/'));const header=el(`<header class="lesson-top"><h1>${esc(lesson.title)}</h1><span class="plain-muted"></span></header>`);host.append(header);
 const stage=el('<section class="pilot-stage"></section>');host.append(stage);
 const advance=()=>{recordingCleanup?.();recordingCleanup=null;stopSpeak();if(expressionOnly){renderCompletion();return;}const p=lessonProgress(lesson);updateProgress(lesson,{position:p.position+1});show();};
 function show(){
 const p=lessonProgress(lesson);if(expressionOnly)p.position=lesson.activities.length-1;if(p.position>=lesson.activities.length){time();completeLesson(lesson);renderCompletion();return;}
 const a=lesson.activities[p.position];stage.replaceChildren();header.querySelector('span').textContent=`${p.position+1} / ${lesson.activities.length}`;
 if(a.type==='material'){lines(stage,lesson.text);stage.append(button('继续',advance));return;}
 if(a.type==='rule'){
 stage.append(el(`<h2>用法</h2><p class="rule-copy">${esc(lesson.rule)}</p><p class="de">${esc(lesson.example)}</p>`));audio(stage,lesson.example);
 const refs=el('<details><summary>完整语法参考</summary></details>');lesson.grammarRefs.forEach(ref=>refs.append(link(GRAMMAR_LESSONS.find(g=>g.id===ref)?.title||'查看规则',`#/grammar/${ref}`)));stage.append(refs);
 if(lesson.unit==='ic-u2'){const numbers=el('<details><summary>数字 0–20</summary><div class="number-grid"></div></details>');NUMBER_AUDIO.forEach((n,i)=>{const row=el(`<div><span>${i} · ${n}</span></div>`);audio(row,n);numbers.querySelector('div').append(row);});stage.append(numbers);}
 stage.append(button('继续',advance));return;
 }
 if(a.type==='speak'){
 let saved=p.answers[a.id]||{};
 stage.append(el(`<h2>${esc(a.prompt)}</h2><p class="plain-muted">${esc(lesson.pronunciation)}</p>`));
 const reveal=el('<details><summary>参考表达与录音对照</summary><div></div></details>');reveal.addEventListener('toggle',()=>{if(reveal.open){saved={...saved,hinted:true};saveActivity(lesson,a.id,{hinted:true});}});
 reveal.querySelector('div').append(el(`<p class="de">${esc(a.model)}</p><p class="plain-muted">评分仅供参考；下面记录的是自评。</p>`));
 const practice=speakPractice(reveal.querySelector('div'),a.model,{onScore:(score)=>saveActivity(lesson,a.id,{machineScore:score,machineAt:Date.now()})});recordingCleanup=()=>practice.dispose?.();stage.append(reveal);
 const responseBox=el('<textarea class="plain-answer" aria-label="自己的表达（可选文字）" placeholder="也可以写下自己的表达"></textarea>');responseBox.value=saved.draft||'';responseBox.addEventListener('input',()=>saveActivity(lesson,a.id,{draft:responseBox.value}));stage.append(responseBox);
 const self=(value)=>{saveActivity(lesson,a.id,{final:true,selfReport:value,skipped:value==='pending',hinted:saved.hinted||false});advance();};
 stage.append(button('已完成表达',()=>self('completed')));stage.append(button('稍后再练',()=>self('pending'),'btn secondary'));return;
 }
 const actual=a.type==='word'?wordTask(a.wordId,'text',a.id):a;
 if(!actual){advance();return;}
 if(a.type==='word'&&!loadSrs()[canonicalWordId(a.wordId)]&&!p.answers[a.id]?.introduced){
 const w=wordFor(a.wordId);stage.append(el(`<h2 class="de">${esc(spoken(w))}</h2><p>${esc(w.zh)}</p>${w.pl?`<p class="plain-muted">复数：die ${esc(w.pl)}</p>`:''}`));audio(stage,spoken(w));
 stage.append(button('练一下',()=>{saveActivity(lesson,a.id,{introduced:true});show();}));return;
 }
 const area=el('<div></div>');stage.append(area);
 task(area,actual,{state:p.answers[a.id],patch:s=>saveActivity(lesson,a.id,s),done:advance,attempt:(correct)=>{if(a.wordId){const result=recordWord(a.wordId,'text',correct,`${lessonKey(lesson)}:${a.id}`);if(!result.enrolled)stage.append(el('<p class="plain-muted">今日新增已完成，这个词保留在待加入复习中。</p>'));}}});
 if(a.type==='word'){
 const w=wordFor(a.wordId);const detail=el(`<details><summary>词义与发音</summary><p class="de">${esc(spoken(w))}</p><p>${esc(w.zh)}</p>${w.pl?`<p>复数：die ${esc(w.pl)}</p>`:''}</details>`);
 detail.addEventListener('toggle',()=>{if(detail.open)saveActivity(lesson,a.id,{hinted:true});});audio(detail,spoken(w));stage.prepend(detail);
 }
 }
 function renderCompletion(){
 host.replaceChildren();const p=lessonProgress(lesson);head(host,lesson.title,'已学习');
 const oral=p.answers.speak;host.append(el(`<div class="plain-feedback"><p>独立检查：${p.independentPassed?'通过':'可继续巩固'}</p><p>表达：${oral?.selfReport==='completed'?'已完成（自评）':'待练习'}</p><p>延迟复习：${loadIntegrated().reviews?.[lessonKey(lesson)]?.done?'已通过':'后续安排'}</p></div>`));
 const next=nextPilot();if(next)host.append(link(`下一课：${next.title}`,`#/learn/${next.id}`));host.append(link('练习表达',`#/learn/${lesson.id}/speak`));host.append(link('复习本课','#/learn-review/'+lesson.id));host.append(link('本课单词',`#/vocab/study/current-${lesson.id}`));host.append(link('返回学习','#/'));
 }
 show();
}

function runReview(host,key,keys,onDone) {
 let saved=sessionGet(key);if(!saved||saved.done){const all=dueReviews(999);saved={items:keys.map(k=>all.find(x=>x.key===k)).filter(Boolean),position:0,answers:{},startedAt:Date.now(),done:false};sessionSave(key,saved);}
 const show=()=>{host.replaceChildren();head(host,'复习');host.append(link('返回学习','#/'));
 if(saved.position>=saved.items.length){saved.done=true;sessionSave(key,saved);onDone();return;}
 const r=saved.items[saved.position];const itemKey=`${r.key}:${saved.startedAt}`;const area=el('<div></div>');host.append(area);
 task(area,r.activity,{state:saved.answers[itemKey],patch:s=>{saved.answers[itemKey]=s;sessionSave(key,saved);},done:s=>{submitReview(r.key,s.correct&&!s.hinted&&s.attempts===1,itemKey);saved.position++;sessionSave(key,saved);show();}});
 };show();
}
export function renderReview(host,lessonId) {
 if(lessonId){const l=findPilotLesson(lessonId);if(!l)return;
 const key=`practice:${lessonKey(l)}`;let saved=sessionGet(key);if(!saved||saved.done)saved={position:0,answers:{},done:false};
 const show=()=>{host.replaceChildren();head(host,l.title,'加练');host.append(link('返回学习','#/'));
 if(saved.position>=l.reviews.length){saved.done=true;sessionSave(key,saved);host.append(el('<p>加练完成。延迟复习仍按原计划安排。</p>'));return;}
 const activity=l.reviews[saved.position];task(host,activity,{state:saved.answers[activity.id],patch:s=>{saved.answers[activity.id]=s;sessionSave(key,saved);},done:()=>{saved.position++;sessionSave(key,saved);show();}});};show();return;}

 const existing=sessionGet('course-review');const keys=existing&&!existing.done?existing.items.map(r=>r.key):dueReviews(3).map(r=>r.key);
 runReview(host,'course-review',keys,()=>{host.replaceChildren();head(host,'复习完成');host.append(link('返回学习','#/'));});
}

function selectedWords(scope='current') {
 if(scope.startsWith('current-'))return findPilotLesson(scope.slice(8))?.words||currentWords();
 if(scope==='studied')return studiedWords();if(scope==='wordbook')return Object.keys(getWordbook());
 if(scope==='all')return VOCAB.map(w=>w.id);if(scope.startsWith('theme-'))return VOCAB.filter(w=>w.theme===scope.slice(6)).map(w=>w.id);
 return currentWords();
}
export function renderWords(host) {
 head(host,'单词');const all=[...VOCAB.map(w=>w.id),...Object.keys(getWordbook())];const srs=loadSrs();const due=[...new Set(all.map(canonicalWordId))].filter(id=>srs[id]?.due<=Date.now()).length;
 host.append(el(`<p class="plain-muted">今日还可新增 ${newWordRemaining()} 个</p>`));
 host.append(link(`到期复习 · ${due}`,'#/vocab/study/review'));
 const current=nextPilot()||PILOT_LESSONS.at(-1);host.append(link(current.title,'#/vocab/study/current','当前课程词表'));
 host.append(link('已学课程词','#/vocab/study/studied'));host.append(link('生词本练习','#/vocab/study/wordbook'));host.append(link('查看生词本','#/vocab/wordbook'));
 const list=el('<details open><summary>本课单词</summary></details>');current.words.forEach(id=>{const w=wordFor(id);if(w)list.append(link(spoken(w),`#/vocab/word/${id}`,w.zh));});host.append(list);
 const more=el('<details><summary>其他词表</summary></details>');THEMES.forEach(t=>more.append(link(t.name,`#/vocab/study/theme-${t.id}`)));more.append(link('全部单词','#/vocab/study/all'));host.append(more);
}
export function renderWordStudy(host,scope='current') {
 const key=`words:${scope}`;let session=sessionGet(key);
 if(!session||session.done){const ids=scope==='review'?[...VOCAB.map(w=>w.id),...Object.keys(getWordbook())]:selectedWords(scope);const queue=wordQueue(ids,{reviewOnly:scope==='review'});session={startedAt:Date.now(),position:0,answers:{},done:false,items:queue.flatMap(id=>['text','listening','recall'].map(mode=>({id,mode})))};sessionSave(key,session);}
 const show=()=>{
 host.replaceChildren();head(host,'单词练习');host.append(link('返回单词','#/vocab'));
 if(session.position>=session.items.length){if(session.items.length&&!session.done)logActivity({items:session.items.length,ok:Object.values(session.answers).filter(a=>a.firstCorrect&&!a.hinted).length,completionId:`${key}:${session.startedAt}`});session.done=true;sessionSave(key,session);host.append(el(`<p>${session.items.length?'本次练习完成。':'当前没有待练单词。'}</p><p class="plain-muted">今日还可新增 ${newWordRemaining()} 个</p>`));return;}
 const item=session.items[session.position];const a=wordTask(item.id,item.mode,`${item.id}:${item.mode}`);if(!a){session.position++;sessionSave(key,session);show();return;}
 if(item.mode==='text'&&!loadSrs()[canonicalWordId(item.id)]&&!session.answers[a.id]?.introduced){const w=wordFor(item.id);host.append(el(`<h2 class="de">${esc(spoken(w))}</h2><p>${esc(w.zh)}</p>${w.pl?`<p>复数：die ${esc(w.pl)}</p>`:''}`));audio(host,spoken(w));host.append(button('练一下',()=>{session.answers[a.id]={...session.answers[a.id],introduced:true};sessionSave(key,session);show();}));return;}
 host.append(el(`<p class="plain-muted">${session.position+1} / ${session.items.length}</p>`));const area=el('<div></div>');host.append(area);
 task(area,a,{state:session.answers[a.id],patch:s=>{session.answers[a.id]=s;sessionSave(key,session);},attempt:correct=>recordWord(item.id,item.mode,correct,`${key}:${session.startedAt}:${a.id}`),done:()=>{session.position++;sessionSave(key,session);show();}});
 };show();
}

export function renderReadingShelf(host,mode='read') {
 head(host,'读听');const tabs=el('<div class="plain-actions"></div>');tabs.append(link('阅读','#/readlisten/read'));tabs.append(link('听力','#/readlisten/listen'));host.append(tabs);
 for(const unit of FRAMEWORK.slice(0,2)){host.append(el(`<h2 class="section-title">${esc(unit.title)}</h2>`));PILOT_MATERIALS.filter(m=>m.unit===unit.id).forEach(m=>host.append(link(m.title,`#/material/${m.id}/${mode}`,`${m.sentences.length} 句`)));}
 const core=el('<details><summary>课程材料</summary></details>');PILOT_LESSONS.forEach(l=>core.append(link(l.title,`#/material/${l.id}/${mode}`)));host.append(core);
 host.append(link('旧版读听资料','#/reference/readlisten'));
}
export function renderMaterial(host,id,mode='read') {
 const found=PILOT_MATERIALS.find(m=>m.id===id)||findPilotLesson(id)?.material;if(!found){head(host,'未找到材料');return;}
 head(host,found.title);host.append(link('返回读听',`#/readlisten/${mode}`));const content=el('<div></div>');host.append(content);lines(content,found.sentences,{hideText:mode==='listen'});
 const key=`material:${id}@${CONTENT_VERSION}:${mode}`;let saved=sessionGet(key)||{answers:{},openedAt:Date.now(),started:false,done:false};sessionSave(key,saved);
 const exercise=found.practice||findPilotLesson(id)?.checks[0];if(exercise){const area=el('<div></div>');
 const start=()=>{if(saved.done)saved={...saved,answers:{},started:false,done:false};saved.started=true;sessionSave(key,saved);task(area,exercise,{state:saved.answers,patch:s=>{saved.answers=s;sessionSave(key,saved);},done:s=>{saved.done=true;sessionSave(key,saved);logTrial('material-practice',{materialId:id,version:CONTENT_VERSION,correct:!!s.firstCorrect&&!s.hinted});area.replaceChildren(el('<p>练习完成。</p>'));}});};
 host.append(button('练习',start));host.append(area);if(saved.started&&!saved.done)start();}
}
export function renderCoverage(host) {
 head(host,'知识覆盖');host.append(link('返回学习','#/'));
 const table=el('<div class="table-scroll"><table><thead><tr><th>内容</th><th>首次学习</th><th>复现</th><th>检查</th></tr></thead><tbody></tbody></table></div>');
 KNOWLEDGE_MAP.forEach(k=>table.querySelector('tbody').append(el(`<tr><td>${esc(k.title)}</td><td>${esc(findPilotLesson(k.first).title)}</td><td>${k.revisit.map(id=>esc(findPilotLesson(id).title)).join('、')}</td><td>${esc(findPilotLesson(k.check).title)}</td></tr>`)));host.append(table);
 host.append(el('<p class="plain-muted">记录教学覆盖，不代表通过 A1 或已经掌握。</p>'));
}
export function renderProfile(host) {
 head(host,'我的');const d=loadIntegrated();const learned=TEXT_LESSONS.filter(l=>textProgress(l,d).d2).length;const kept=TEXT_LESSONS.filter(l=>remembered(l,d)).length;
 host.append(el(`<section class="plain-stats"><div><b>${learned}</b><span>篇课文已学完</span></div><div><b>${kept}</b><span>篇已记住</span></div><div><b>${getStreak()}</b><span>连续天数</span></div></section>`));
 host.append(link('设置与备份','#/settings'));host.append(el('<h2 class="section-title">资料库</h2>'));host.append(link('综合课试学版（8 课）','#/reference/pilot','GPT 版，旧记录保留'));host.append(link('语法参考','#/grammar'));host.append(link('旧版课程资料','#/reference/path'));host.append(link('A1 题型与模考','#/reference/panorama'));host.append(link('知识覆盖','#/coverage'));
 const refs=el('<details><summary>学习参考</summary></details>');refs.append(link('歌德学院发音训练','https://www.goethe.de/de/spr/ueb/ast.html'));host.append(refs);
 const trial=el('<details><summary>试学记录</summary><p class="plain-muted">记录卡住的位置与感受，随学习备份导出。</p><textarea class="plain-answer" aria-label="试学感受"></textarea></details>');trial.append(button('保存',()=>{const input=trial.querySelector('textarea');if(input.value.trim()){logTrial('user-note',{text:input.value.trim()});input.value='';trial.append(el('<p role="status">已保存</p>'));}}));host.append(trial);
}
function optionalAI(host,lesson){
 const panel=el('<details><summary>AI 加练</summary><p class="plain-muted">生成一份短材料，不计入课程掌握记录。</p></details>');const area=el('<div></div>');
 const b=button('生成材料',async()=>{
 b.disabled=true;area.textContent='正在生成…';
 try{
 const [{buildArticleRequest,fetchArticle},{coachConfigured,getCoachSecrets},{auditArticle}]=await Promise.all([import('../daily-article.js?v=2'),import('../coach-secrets.js'),import('../../coach-worker/src/a1-guard.js?v=2')]);
 if(!coachConfigured())throw Error('not-configured');
 const evidence=loadWordLearning().evidence||{};const practiced=Object.keys(evidence).filter(id=>evidence[id]?.text?.lastCorrect).map(id=>wordFor(id)?.de).filter(Boolean);
 const completed=PILOT_LESSONS.filter(l=>lessonProgress(l).done);
 const inputWords=completed.flatMap(l=>l.text.flatMap(s=>s.de.match(/[a-zäöüß]+/giu)||[]));
 const grammar=[...new Set(completed.flatMap(l=>l.focus))];
 const request=buildArticleRequest({seedWords:lesson.words.slice(0,5).map(id=>wordFor(id)?.de).filter(Boolean),knownWords:[...new Set([...practiced,...inputWords])],grammarZh:lesson.rule.slice(0,60),allowedGrammar:grammar,sceneHint:lesson.title});
 const result=await fetchArticle(request,getCoachSecrets());if(!result.article||!auditArticle(result.article,request).ok)throw Error('no-material');
 area.replaceChildren();lines(area,result.article.sentences);
 }catch{area.replaceChildren(el('<p>暂时无法生成，可以继续固定练习。</p>'),link('固定加练',`#/learn-review/${lesson.id}`));}finally{b.disabled=false;}
 });panel.append(b,area);host.append(panel);
}

export function renderPilotWord(host,id) {
 const w=wordFor(id);if(!w){head(host,'未找到单词');return;}
 head(host,spoken(w));host.append(link('返回单词','#/vocab'));host.append(el(`<p>${esc(w.zh)}</p>${w.pl?`<p>复数：die ${esc(w.pl)}</p>`:''}`));audio(host,spoken(w));
 const e=loadWordLearning().evidence?.[canonicalWordId(id)]||{};const labels={text:'文字辨认',listening:'听音辨认',recall:'主动回忆'};
 host.append(el(`<p class="plain-muted">${Object.entries(labels).map(([key,label])=>`${label}：${e[key]?e[key].lastCorrect?'最近答对':'待练习':'未练习'}`).join(' · ')}</p>`));
 const refs=INTEGRATED_WORD_EXAMPLES[w.id]||[];if(refs.length){const d=el('<details><summary>课程中的用法</summary></details>');refs.forEach(r=>{d.append(link(r.title,`#/learn/${r.lessonId}`));const sentence=r.sentences.find(s=>s.de.toLocaleLowerCase('de-DE').includes(w.de.toLocaleLowerCase('de-DE').split(',')[0]))||r.sentences[0];if(sentence){d.append(el(`<p class="de">${esc(sentence.de)}</p><p>${esc(sentence.zh)}</p>`));audio(d,sentence.de);}});host.append(d);}
 const more=el('<details><summary>更多例句与词形</summary></details>');more.append(link('查看词条',`#/vocab/word-${w.id}`));host.append(more);
}
