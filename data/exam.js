// 应试板块的数据层。产品形态见 docs/product-shape.md 第 6 条决策。
//
// 应试是三层，材料来源刻意不同：
//   每日小测 —— 当天的今日文章现出的 2 道判断对错（不在这个文件里，由 AI 随文章生成）
//   阶段测验 —— 这里的 EXAM_TASKS，全是没见过的新材料，每走完 5 格串联一次
//   毕业模考 —— 还是这里的 EXAM_TASKS，只是按 part + teil 串成整套
//
// 所以模考不是另一套数据，是同一套数据的另一种取用方式。别为它再建一张表。
//
// ⚠️ items[] 里写的必须是 js/exercises.js 的 renderExercise 能直接吃的对象。
// 题干字段名是 **prompt** 不是 q —— renderChoice 读的是 item.prompt，
// 而 js/ui.js 的 renderQuiz 读的是 ex.q，两套并存，写错了题干就是空白。
import { EXAM_CELLS } from './panorama.js';

/**
 * 11 格的权威口径。已按官方模考平台 bfu.goethe.de/a1_sd1/ 逐模块核实（2026-07）。
 * count/points 是官方题量与分值：一组题就得出满这个数，不能随手写三道充数
 * （tests/exam-data.test.mjs 会拦）。plays 是听力播放次数上限。
 */
export const EXAM_PARTS = EXAM_CELLS.map(cell => ({
  id: cell.id,
  part: cell.id[0] === 'H' ? 'hoeren' : cell.id[0] === 'L' ? 'lesen'
    : cell.id[0] === 'S' ? 'schreiben' : 'sprechen',
  teil: cell.teil,
  count: cell.count || 0,
  points: cell.points || 0,
  plays: cell.plays || 0,
  status: cell.status,
}));

const PART_BY_ID = new Map(EXAM_PARTS.map(part => [part.id, part]));
export function examPart(cellId) {
  return PART_BY_ID.get(cellId) || null;
}

/**
 * 阶段测验与模考的题库。第 5b 步开始填，现在是空的。
 *
 * 一条的形状：
 * {
 *   id: 'x-l3-01',            // x- 前缀，和 li- / rp- / u1l1 / v1 都不撞车
 *   cellId: 'L3',
 *   titleZh: '看三块告示牌，判断说法对不对',
 *   source: { kind: 'inline' }                       // 自带极短原创正文
 *         | { kind: 'reading', id: 'r03' }           // 精读原文原样铺出来
 *         | { kind: 'listening', id: 'li-b01', range: [2, 7] },
 *   stimulus: [{ layout: 'aushang', de, zh, newLemmas: [] }],   // inline 时才有
 *   prereq: { afterCell: 10, skills: ['nicht-kein'], sourceDone: true },
 *   skills: ['read-scan'],    // 组级默认，喂 recordAnswer；必须是课程里已存在的标签
 *   items: [{ type:'choice', prompt, options, a, explain, evidence?, skills? }],
 * }
 */
/**
 * 材料一律原创，不抄真题原文 —— 题型结构是公开的，题目自己出。
 * 语言守 A1 红线：无从句（weil/dass/wenn）、无第二格介词、无被动、
 * 过去时只有 war/hatte。
 *
 * stimulus 分两级，对应真考试的两种版面：
 *   task.stimulus —— 整组共用一份材料（L1：一封信配 5 句判断）
 *   item.stimulus —— 每道题自带一块牌子（L3：5 块告示牌各判一句）
 */
const RF = ['Richtig', 'Falsch'];

export const EXAM_TASKS = [
  /* ---------- L1 · 短信 / 邮件 / 通知 · 判断对错 ---------- */
  {
    id: 'x-l1-01',
    cellId: 'L1',
    titleZh: '读一封朋友的邮件，判断五句话对不对',
    subZh: 'Goethe A1 阅读第一部分 · 5 题 5 分',
    source: { kind: 'inline' },
    prereq: { afterCell: 5, skills: ['time-informal'] },
    skills: ['time-informal', 'separable-verbs'],
    stimulus: [{
      layout: 'mail',
      title: 'E-Mail von Lena',
      de: 'Hallo Ben,\nam Samstag habe ich Zeit. Wir können zusammen ins Kino gehen.\n'
        + 'Der Film beginnt um halb acht. Ich hole dich um sieben Uhr ab.\n'
        + 'Die Karte kostet neun Euro. Bitte bring das Geld mit.\nBis Samstag!\nLena',
      zh: '你好 Ben，\n周六我有空。我们可以一起去看电影。\n电影七点半开始。我七点来接你。\n'
        + '票九欧。请把钱带上。\n周六见！\nLena',
    }],
    items: [
      { type: 'choice', prompt: 'Lena und Ben gehen am Samstag ins Kino.', options: RF, a: 0,
        explain: '第 2 句 Wir können zusammen ins Kino gehen，时间在第 1 句 am Samstag。',
        skills: ['modal-koennen-wollen'] },
      { type: 'choice', prompt: 'Der Film beginnt um acht Uhr.', options: RF, a: 1,
        explain: 'halb acht 是七点半，不是八点 —— 德语的 halb 指「差半小时到下一个整点」。',
        skills: ['time-informal'] },
      { type: 'choice', prompt: 'Lena kommt um sieben Uhr zu Ben.', options: RF, a: 0,
        explain: 'Ich hole dich um sieben Uhr ab（abholen 是可分动词，ab 甩到句末）。',
        skills: ['separable-verbs'] },
      { type: 'choice', prompt: 'Die Karte kostet neunzehn Euro.', options: RF, a: 1,
        explain: 'neun 是 9，neunzehn 才是 19 —— 听力和阅读都爱在这两个词上设陷阱。',
        skills: ['numbers-1-20'] },
      { type: 'choice', prompt: 'Ben muss Geld mitbringen.', options: RF, a: 0,
        explain: 'Bitte bring das Geld mit 是命令式，等于「你得带钱」。',
        skills: ['imperative-du'] },
    ],
  },
  {
    id: 'x-l1-02',
    cellId: 'L1',
    titleZh: '读一条请假短信，判断五句话对不对',
    subZh: 'Goethe A1 阅读第一部分 · 5 题 5 分',
    source: { kind: 'inline' },
    prereq: { afterCell: 10, skills: ['nicht-kein'] },
    skills: ['nicht-kein', 'symptoms'],
    stimulus: [{
      layout: 'mail',
      title: 'Nachricht an die Lehrerin',
      de: 'Hallo Frau Weber,\nich bin heute krank. Ich habe Fieber und Halsschmerzen.\n'
        + 'Ich kann nicht zum Deutschkurs kommen.\nMeine Freundin Mia bringt Ihnen meine Hausaufgaben.\n'
        + 'Am Montag bin ich wieder da.\nViele Grüße, Ana',
      zh: '您好 Weber 老师，\n我今天生病了。我发烧、嗓子疼。\n我不能来上德语课。\n'
        + '我朋友 Mia 会把我的作业带给您。\n周一我就回来了。\n此致，Ana',
    }],
    items: [
      { type: 'choice', prompt: 'Ana ist heute krank.', options: RF, a: 0,
        explain: '第 1 句 ich bin heute krank，直接给出。', skills: ['sein-sg'] },
      { type: 'choice', prompt: 'Ana kommt heute zum Deutschkurs.', options: RF, a: 1,
        explain: 'Ich kann nicht zum Deutschkurs kommen —— nicht 否定的是整个动作。',
        skills: ['nicht-kein'] },
      { type: 'choice', prompt: 'Ana hat Kopfschmerzen.', options: RF, a: 1,
        explain: '信里是 Halsschmerzen（嗓子疼），不是 Kopfschmerzen（头疼）。同一个词尾 -schmerzen，前面那半才是答案。',
        skills: ['symptoms'] },
      { type: 'choice', prompt: 'Mia bringt der Lehrerin die Hausaufgaben.', options: RF, a: 0,
        explain: 'bringt Ihnen —— Ihnen 是第三格的「给您」，指的就是 Frau Weber。',
        skills: ['pronoun-dativ'] },
      { type: 'choice', prompt: 'Ana kommt am Dienstag wieder.', options: RF, a: 1,
        explain: 'Am Montag bin ich wieder da，是周一不是周二。', skills: ['prep-time-an-um'] },
    ],
  },
  {
    id: 'x-l1-03',
    cellId: 'L1',
    titleZh: '读楼道里的一张通知，判断五句话对不对',
    subZh: 'Goethe A1 阅读第一部分 · 5 题 5 分',
    source: { kind: 'inline' },
    prereq: { afterCell: 15, skills: ['prep-time-an-um'] },
    skills: ['prep-time-an-um', 'kein-basic'],
    stimulus: [{
      layout: 'aushang',
      title: 'Aushang im Hausflur',
      de: 'Liebe Nachbarn,\nam Dienstag gibt es von neun bis zwölf Uhr keinen Strom.\n'
        + 'Der Aufzug fährt an diesem Tag auch nicht.\nBitte nehmen Sie die Treppe.\n'
        + 'Danke!\nIhr Hausmeister',
      zh: '各位邻居：\n周二九点到十二点停电。\n那天电梯也不运行。\n请走楼梯。\n谢谢！\n你们的管理员',
    }],
    items: [
      { type: 'choice', prompt: 'Am Dienstag gibt es am Vormittag keinen Strom.', options: RF, a: 0,
        explain: 'von neun bis zwölf Uhr 正是上午。es gibt keinen … 是「没有…」的固定说法。',
        skills: ['es-impersonal'] },
      { type: 'choice', prompt: 'Um elf Uhr funktioniert der Strom.', options: RF, a: 1,
        explain: '十一点落在 9–12 这段里，还在停电。判断题最常考的就是「某个点在不在这个区间里」。',
        skills: ['prep-time-an-um'] },
      { type: 'choice', prompt: 'Der Aufzug fährt am Dienstag normal.', options: RF, a: 1,
        explain: 'fährt … auch nicht —— nicht 在句末否定整句。', skills: ['nicht-kein'] },
      { type: 'choice', prompt: 'Die Nachbarn sollen die Treppe nehmen.', options: RF, a: 0,
        explain: 'Bitte nehmen Sie die Treppe 是 Sie 的命令式：动词提到最前，Sie 跟在后面。',
        skills: ['imperative-du'] },
      { type: 'choice', prompt: 'Der Aushang ist für die Nachbarn.', options: RF, a: 0,
        explain: '抬头 Liebe Nachbarn 就是收件人。读通知先看抬头和落款，能省一半时间。',
        skills: ['plural'] },
    ],
  },

  /* ---------- L3 · 告示牌 Aushang · 判断对错 ---------- */
  {
    id: 'x-l3-01',
    cellId: 'L3',
    titleZh: '五块街上的牌子，各判断一句话',
    subZh: 'Goethe A1 阅读第三部分 · 5 题 5 分 · 每题换一块牌子',
    source: { kind: 'inline' },
    prereq: { afterCell: 5, skills: [] },
    skills: ['prep-time-an-um'],
    items: [
      { type: 'choice', a: 1, options: RF,
        stimulus: { layout: 'sign', title: 'An der Bäckerei', de: 'Heute geschlossen.\nAb Montag sind wir wieder für Sie da.', zh: '今日休息。周一起恢复营业。' },
        prompt: 'Sie möchten heute Brot kaufen. Die Bäckerei ist offen.',
        explain: 'geschlossen = 关门。牌子上只要出现 geschlossen，今天就别去了。' },
      { type: 'choice', a: 1, options: RF,
        stimulus: { layout: 'sign', title: 'Praxis Dr. Klein', de: 'Mo, Di, Do  8–12 Uhr\nMi  15–18 Uhr', zh: '周一、二、四 8–12 点；周三 15–18 点' },
        prompt: 'Sie wollen am Mittwoch um neun Uhr zum Arzt gehen. Das geht.',
        explain: '周三只有下午 15–18 点。看这种时间表，先找「星期」再找「点」，顺序反了就会掉坑。',
        skills: ['prep-time-an-um'] },
      { type: 'choice', a: 0, options: RF,
        stimulus: { layout: 'sign', title: 'Im Supermarkt', de: 'Angebot heute:\nÄpfel — 1 Kilo nur 1,50 €', zh: '今日特价：苹果每公斤仅 1.50 欧' },
        prompt: 'Ein Kilo Äpfel kostet heute weniger als zwei Euro.',
        explain: '1,50 € 小于 2 €。weniger als 是比较级说法，A1 只要求会认，不要求变词尾。',
        skills: ['comparative'] },
      { type: 'choice', a: 0, options: RF,
        stimulus: { layout: 'sign', title: 'Am Bahnhof', de: 'Aufzug kaputt.\nBitte nehmen Sie die Treppe.', zh: '电梯故障。请走楼梯。' },
        prompt: 'Sie können den Aufzug heute nicht benutzen.',
        explain: 'kaputt = 坏了。牌子上出现 kaputt / außer Betrieb，就是「这东西现在用不了」。',
        skills: ['modal-koennen-wollen'] },
      { type: 'choice', a: 0, options: RF,
        stimulus: { layout: 'sign', title: 'Im Schwimmbad', de: 'Kinder unter 6 Jahren schwimmen frei.', zh: '六岁以下儿童免费游泳。' },
        prompt: 'Ihr Kind ist fünf Jahre alt. Es zahlt nichts.',
        explain: 'unter 6 = 不到六岁，五岁在范围里。frei 在告示牌上常常是「免费」，不是「空着」。',
        skills: ['numbers-1-20'] },
    ],
  },
  {
    id: 'x-l3-02',
    cellId: 'L3',
    titleZh: '五块学校和宿舍的牌子，各判断一句话',
    subZh: 'Goethe A1 阅读第三部分 · 5 题 5 分 · 每题换一块牌子',
    source: { kind: 'inline' },
    prereq: { afterCell: 10, skills: ['modal-duerfen'] },
    skills: ['modal-duerfen'],
    items: [
      { type: 'choice', a: 0, options: RF,
        stimulus: { layout: 'sign', title: 'Am Schwarzen Brett', de: 'Deutschkurs A1\nbeginnt am 3. September\num 9 Uhr, Raum 12', zh: 'A1 德语课 9 月 3 日 9 点开始，12 号教室' },
        prompt: 'Der Kurs beginnt im September.',
        explain: 'am 3. September —— 日期里的序数词后面那个词就是月份。',
        skills: ['ordinal-date'] },
      { type: 'choice', a: 1, options: RF,
        stimulus: { layout: 'sign', title: 'Im Treppenhaus', de: 'Bitte hier nicht rauchen!', zh: '此处请勿吸烟！' },
        prompt: 'Hier dürfen Sie rauchen.',
        explain: 'nicht rauchen 是禁止。dürfen 问的是「允不允许」，牌子已经说了不允许。',
        skills: ['modal-duerfen'] },
      { type: 'choice', a: 1, options: RF,
        stimulus: { layout: 'sign', title: 'Waschküche', de: 'Waschmaschine bitte nur bis 22 Uhr benutzen.', zh: '洗衣机请只在 22 点前使用。' },
        prompt: 'Um 23 Uhr können Sie noch waschen.',
        explain: 'bis 22 Uhr 是上限，23 点已经超了。bis 这个词在告示牌上几乎每次都是考点。',
        skills: ['prep-time-an-um'] },
      { type: 'choice', a: 0, options: RF,
        stimulus: { layout: 'sign', title: 'Am Büro', de: 'Freitag nur bis 13 Uhr geöffnet.', zh: '周五仅营业至 13 点。' },
        prompt: 'Am Freitagnachmittag ist das Büro zu.',
        explain: 'bis 13 Uhr 之后就关门，下午自然是 zu（关着）。geöffnet ↔ zu / geschlossen 是一对。' },
      { type: 'choice', a: 0, options: RF,
        stimulus: { layout: 'sign', title: 'Am Hauseingang', de: 'Fahrräder bitte vor das Haus stellen.', zh: '自行车请停在楼前。' },
        prompt: 'Sie sollen Ihr Fahrrad nicht ins Haus bringen.',
        explain: 'vor das Haus stellen = 停到楼外。这里是「往哪儿放」，所以用第四格 das Haus。',
        skills: ['location-dativ'] },
    ],
  },
  {
    id: 'x-l3-03',
    cellId: 'L3',
    titleZh: '五块出门在外的牌子，各判断一句话',
    subZh: 'Goethe A1 阅读第三部分 · 5 题 5 分 · 每题换一块牌子',
    source: { kind: 'inline' },
    prereq: { afterCell: 15, skills: ['numbers-tens'] },
    skills: ['numbers-tens'],
    items: [
      { type: 'choice', a: 0, options: RF,
        stimulus: { layout: 'sign', title: 'Anzeige am Bahnhof', de: 'Zug nach Hamburg\nheute von Gleis 5', zh: '开往汉堡的列车今日从 5 号站台发车' },
        prompt: 'Der Zug nach Hamburg fährt von Gleis fünf.',
        explain: '牌子上的数字和句子里的数字词要对上：5 = fünf。', skills: ['numbers-1-20'] },
      { type: 'choice', a: 0, options: RF,
        stimulus: { layout: 'sign', title: 'Im Laden', de: 'Bitte an Kasse 2 bezahlen.', zh: '请到 2 号收银台付款。' },
        prompt: 'Sie sollen an Kasse zwei bezahlen.',
        explain: 'Bitte … bezahlen 是礼貌的要求，等于 sollen。', skills: ['modal-muessen-sollen'] },
      { type: 'choice', a: 1, options: RF,
        stimulus: { layout: 'sign', title: 'Am Restaurant', de: 'Warme Küche\n12–14 Uhr und 18–21 Uhr', zh: '热菜供应：12–14 点、18–21 点' },
        prompt: 'Um 16 Uhr bekommen Sie hier ein warmes Essen.',
        explain: '16 点落在两个时段中间，正好没有热菜。两段时间的牌子，考的就是中间那个缺口。',
        skills: ['prep-time-an-um'] },
      { type: 'choice', a: 1, options: RF,
        stimulus: { layout: 'sign', title: 'Am Museum', de: 'Montag geschlossen.\nDi–So 10–18 Uhr', zh: '周一闭馆。周二至周日 10–18 点' },
        prompt: 'Am Montag können Sie ins Museum gehen.',
        explain: 'Montag geschlossen 就是周一不开。', skills: ['modal-koennen-wollen'] },
      { type: 'choice', a: 0, options: RF,
        stimulus: { layout: 'sign', title: 'An der Bushaltestelle', de: 'Am Wochenende fährt der Bus alle 30 Minuten.', zh: '周末公交每 30 分钟一班。' },
        prompt: 'Am Sonntag kommt der Bus alle halbe Stunde.',
        explain: '周日属于 Wochenende；30 Minuten 就是 halbe Stunde。这道题要连着换两次说法。',
        skills: ['numbers-tens'] },
    ],
  },

  /* ---------- S1 · 填表格 Formular ---------- */
  {
    id: 'x-s1-01',
    cellId: 'S1',
    titleZh: '读一段介绍，替朋友填报名表',
    subZh: 'Goethe A1 写作第一部分 · 5 个空 5 分 · 答案全在上面那段话里',
    source: { kind: 'inline' },
    prereq: { afterCell: 10, skills: ['ordinal-date'] },
    skills: ['kurs-anmeldung', 'ordinal-date'],
    stimulus: [{
      layout: 'mail',
      title: 'Information',
      de: 'Ihre Freundin Mai Nguyen kommt aus Vietnam und möchte einen Deutschkurs machen.\n'
        + 'Sie ist am 12. Mai 1999 geboren. Sie wohnt in der Gartenstraße 8 in Leipzig.\n'
        + 'Mai ist Studentin.',
      zh: '你的朋友 Mai Nguyen 来自越南，想报一个德语班。\n她 1999 年 5 月 12 日出生，住在莱比锡花园街 8 号。\nMai 是学生。',
    }],
    items: [
      { type: 'fill', prompt: 'Anmeldung Deutschkurs — Familienname:', hint: '姓', a: ['Nguyen'],
        explain: '德语表格里 Familienname 是姓、Vorname 是名。Mai Nguyen 里 Nguyen 才是姓。' },
      { type: 'fill', prompt: 'Vorname:', hint: '名', a: ['Mai'],
        explain: '写在前面的 Mai 是名字。填表最常丢分的就是姓名颠倒。' },
      { type: 'fill', prompt: 'Geburtsdatum:', hint: 'TT.MM.JJJJ', a: ['12.05.1999', '12.5.1999', '12. Mai 1999', '12.05.99'],
        explain: '德语日期是「日.月.年」：12. Mai 1999 → 12.05.1999。和中文顺序正好相反。',
        skills: ['ordinal-date'] },
      { type: 'fill', prompt: 'Straße und Hausnummer:', hint: 'z. B. Hauptstraße 3', a: ['Gartenstraße 8', 'Gartenstrasse 8', 'Gartenstr. 8'],
        explain: '德语地址是「街名在前、门牌号在后」，和英语相反。' },
      { type: 'fill', prompt: 'Beruf:', hint: '职业', a: ['Studentin', 'Student'],
        explain: 'Mai 是女生，所以写 Studentin。职业的阴性形式加 -in，考试会看。' },
    ],
  },
  {
    id: 'x-s1-02',
    cellId: 'S1',
    titleZh: '读一段介绍，替朋友办图书馆借书证',
    subZh: 'Goethe A1 写作第一部分 · 5 个空 5 分 · 答案全在上面那段话里',
    source: { kind: 'inline' },
    prereq: { afterCell: 15, skills: ['numbers-large'] },
    skills: ['anmeldung', 'numbers-large'],
    stimulus: [{
      layout: 'mail',
      title: 'Information',
      de: 'Ihr Freund Omar Haddad kommt aus Marokko. Er ist Koch und arbeitet in München.\n'
        + 'Er wohnt am Rosenweg 21 in 80331 München. Er ist am 3. Februar 1994 geboren.\n'
        + 'Omar möchte eine Karte für die Bibliothek.',
      zh: '你的朋友 Omar Haddad 来自摩洛哥。他是厨师，在慕尼黑工作。\n'
        + '他住在慕尼黑玫瑰路 21 号，邮编 80331。他 1994 年 2 月 3 日出生。\nOmar 想办一张图书馆的卡。',
    }],
    items: [
      { type: 'fill', prompt: 'Bibliothek — Familienname:', hint: '姓', a: ['Haddad'],
        explain: 'Omar 是名，Haddad 是姓。' },
      { type: 'fill', prompt: 'Beruf:', hint: '职业', a: ['Koch'],
        explain: 'Er ist Koch —— 说职业时德语不加冠词，直接 Ich bin Koch。' },
      { type: 'fill', prompt: 'Postleitzahl:', hint: '5 位数字', a: ['80331'],
        explain: '德国邮编是 5 位数字，写在城市名前面：80331 München。',
        skills: ['numbers-large'] },
      { type: 'fill', prompt: 'Wohnort:', hint: '城市', a: ['München', 'Muenchen'],
        explain: 'Wohnort 问的是「住在哪座城市」，不是街道。' },
      { type: 'fill', prompt: 'Geburtsdatum:', hint: 'TT.MM.JJJJ', a: ['03.02.1994', '3.2.1994', '3. Februar 1994', '03.02.94'],
        explain: '3. Februar 1994 → 03.02.1994。二月是 02。', skills: ['ordinal-date'] },
    ],
  },

  /* ---------- H1 · 日常短对话 · 三选一 · 播两遍 ---------- */
  {
    id: 'x-h1-01',
    cellId: 'H1',
    titleZh: '路上的六段短对话，听完选答案',
    subZh: 'Goethe A1 听力第一部分 · 6 题 6 分 · 每段最多听两遍',
    source: { kind: 'inline' },
    prereq: { afterCell: 5, skills: [] },
    skills: ['time-informal', 'location-dativ'],
    items: [
      { type: 'choice', plays: 2, audioText: 'Entschuldigung, wann fährt der nächste Bus zum Bahnhof? Um Viertel nach drei.',
        prompt: 'Wann fährt der Bus?', options: ['Um 3.15 Uhr', 'Um 3.45 Uhr', 'Um 4.15 Uhr'], a: 0,
        explain: 'Viertel nach drei = 三点过一刻 = 3:15。nach 是「过」，vor 才是「差」。',
        skills: ['time-informal'] },
      { type: 'choice', plays: 2, audioText: 'Zwei Fahrkarten nach Köln, bitte. Das macht achtzehn Euro.',
        prompt: 'Was kosten die Fahrkarten?', options: ['8 Euro', '18 Euro', '80 Euro'], a: 1,
        explain: 'achtzehn = 18。acht(8) / achtzehn(18) / achtzig(80) 三个词只差词尾，听力里必考。',
        skills: ['numbers-tens'] },
      { type: 'choice', plays: 2, audioText: 'Fährt dieser Zug nach Dresden? Nein, der Zug nach Dresden fährt von Gleis neun.',
        prompt: 'Von welchem Gleis fährt der Zug nach Dresden?', options: ['Gleis 9', 'Gleis 5', 'Gleis 19'], a: 0,
        explain: 'neun = 9，neunzehn 才是 19。答案在 Nein 之后 —— 听力里先否定再给正确信息是最常见的套路。',
        skills: ['numbers-1-20'] },
      { type: 'choice', plays: 2, audioText: 'Wie komme ich zum Museum? Gehen Sie hier links und dann geradeaus.',
        prompt: 'Wohin muss die Frau zuerst gehen?', options: ['nach rechts', 'geradeaus', 'nach links'], a: 2,
        explain: '先 links 再 geradeaus。问的是 zuerst（首先），所以选左。', skills: ['directions'] },
      { type: 'choice', plays: 2, audioText: 'Ist der Platz hier frei? Nein, tut mir leid, hier sitzt meine Freundin.',
        prompt: 'Ist der Platz frei?', options: ['Ja, er ist frei.', 'Nein, da sitzt schon jemand.', 'Das sagt der Mann nicht.'], a: 1,
        explain: 'Nein + tut mir leid 已经答完了，后半句是理由。', skills: ['nicht-kein'] },
      { type: 'choice', plays: 2, audioText: 'Wo kann ich hier parken? Vor dem Supermarkt gibt es einen Parkplatz.',
        prompt: 'Wo ist der Parkplatz?', options: ['hinter dem Bahnhof', 'neben der Schule', 'vor dem Supermarkt'], a: 2,
        explain: 'vor dem Supermarkt —— 三个选项都是「介词 + 第三格」，只有名词不一样，听的时候盯名词。',
        skills: ['location-dativ'] },
    ],
  },
  {
    id: 'x-h1-02',
    cellId: 'H1',
    titleZh: '买东西和吃饭的六段短对话，听完选答案',
    subZh: 'Goethe A1 听力第一部分 · 6 题 6 分 · 每段最多听两遍',
    source: { kind: 'inline' },
    prereq: { afterCell: 10, skills: ['akk-review'] },
    skills: ['akk-review', 'numbers-tens'],
    items: [
      { type: 'choice', plays: 2, audioText: 'Was möchten Sie trinken? Einen Tee mit Zitrone, bitte.',
        prompt: 'Was bestellt die Frau?', options: ['einen Kaffee', 'einen Tee', 'ein Wasser'], a: 1,
        explain: 'einen Tee —— einen 是第四格阳性，点单时几乎每次都出现。', skills: ['akk-masc-only'] },
      { type: 'choice', plays: 2, audioText: 'Haben Sie diese Schuhe auch in Größe vierzig? Moment, ich schaue nach. Nein, nur in einundvierzig.',
        prompt: 'Welche Größe gibt es?', options: ['Größe 40', 'Größe 39', 'Größe 41'], a: 2,
        explain: 'einundvierzig = 41。德语两位数是「个位 und 十位」，先说的是个位，正好和中文反着。',
        skills: ['numbers-compound'] },
      { type: 'choice', plays: 2, audioText: 'Das macht zusammen sieben Euro zwanzig. Hier sind zehn Euro.',
        prompt: 'Wie viel Geld gibt der Kunde?', options: ['7,20 Euro', '2,80 Euro', '10 Euro'], a: 2,
        explain: '账单是 7,20，但客人给的是 10。问的是「给了多少」，不是「多少钱」。',
        skills: ['numbers-tens'] },
      { type: 'choice', plays: 2, audioText: 'Einen Tisch für vier Personen um acht Uhr, bitte. Das geht, kein Problem.',
        prompt: 'Für wie viele Personen ist der Tisch?', options: ['für acht', 'für vier', 'für zwei'], a: 1,
        explain: '句子里有两个数字：vier 是人数，acht 是时间。选项故意把时间也放进来。',
        skills: ['reservation'] },
      { type: 'choice', plays: 2, audioText: 'Entschuldigung, wo finde ich die Milch? Die Milch ist hinten rechts.',
        prompt: 'Wo ist die Milch?', options: ['hinten rechts', 'vorne links', 'neben dem Brot'], a: 0,
        explain: 'hinten rechts。方位词常常两两成对出现，听到前一个就要准备好后一个。',
        skills: ['sequence-adverbs'] },
      { type: 'choice', plays: 2, audioText: 'Zahlen Sie bar oder mit Karte? Mit Karte, bitte.',
        prompt: 'Wie bezahlt der Kunde?', options: ['mit Karte', 'bar', 'mit dem Handy'], a: 0,
        explain: '问句给了两个选项，答句只重复其中一个 —— 这类题答案永远在后半句。',
        skills: ['split-bill'] },
    ],
  },
  {
    id: 'x-h1-03',
    cellId: 'H1',
    titleZh: '约时间和上课的六段短对话，听完选答案',
    subZh: 'Goethe A1 听力第一部分 · 6 题 6 分 · 每段最多听两遍',
    source: { kind: 'inline' },
    prereq: { afterCell: 15, skills: ['time-formal'] },
    skills: ['time-formal', 'appointment'],
    items: [
      { type: 'choice', plays: 2, audioText: 'Wann haben wir morgen Deutsch? Von zehn bis halb zwölf.',
        prompt: 'Wann endet der Deutschkurs?', options: ['um 11.30 Uhr', 'um 10 Uhr', 'um 12 Uhr'], a: 0,
        explain: 'halb zwölf = 11:30（差半小时到 12）。问的是「结束」，所以取 bis 后面那个。',
        skills: ['time-informal'] },
      { type: 'choice', plays: 2, audioText: 'Guten Tag, ich möchte einen Termin bei Doktor Schmidt. Können Sie am Donnerstag um neun?',
        prompt: 'Wann ist der Termin?', options: ['am Dienstag um neun', 'am Donnerstag um neun', 'am Donnerstag um zehn'], a: 1,
        explain: 'Dienstag 和 Donnerstag 开头都是 D，听力里最容易混。听到 Do- 就是周四。',
        skills: ['appointment'] },
      { type: 'choice', plays: 2, audioText: 'Wo ist der Kurs heute? Nicht in Raum zwölf, heute sind wir in Raum sieben.',
        prompt: 'In welchem Raum ist der Kurs heute?', options: ['Raum 12', 'Raum 17', 'Raum 7'], a: 2,
        explain: '第一个数字被 nicht 否定掉了，真正的答案在后半句。', skills: ['nicht-kein'] },
      { type: 'choice', plays: 2, audioText: 'Hast du am Wochenende Zeit? Am Samstag nicht, aber am Sonntag gern.',
        prompt: 'Wann hat die Frau Zeit?', options: ['am Samstag', 'am Sonntag', 'am Wochenende nicht'], a: 1,
        explain: 'aber 是转折信号：听到 aber，答案就在它后面。', skills: ['conj-coord'] },
      { type: 'choice', plays: 2, audioText: 'Wie lange dauert die Prüfung? Fünfundsechzig Minuten.',
        prompt: 'Wie lange dauert die Prüfung?', options: ['65 Minuten', '15 Minuten', '55 Minuten'], a: 0,
        explain: 'fünfundsechzig = 5 + 60 = 65。fünfzehn(15) / fünfundfünfzig(55) 都是干扰项。',
        skills: ['numbers-compound'] },
      { type: 'choice', plays: 2, audioText: 'Ich kann heute nicht kommen. Ich bin krank. Gute Besserung! Dann bis nächste Woche.',
        prompt: 'Warum kommt der Mann nicht?', options: ['Er hat keine Zeit.', 'Er ist krank.', 'Er ist im Urlaub.'], a: 1,
        explain: 'A1 不用从句说原因，直接两句并排：Ich kann nicht kommen. Ich bin krank.',
        skills: ['modal-koennen-wollen'] },
    ],
  },
];

const TASK_BY_ID = new Map(EXAM_TASKS.map(task => [task.id, task]));
export function findExamTask(id) {
  return TASK_BY_ID.get(id) || null;
}
export function tasksForCell(cellId) {
  return EXAM_TASKS.filter(task => task.cellId === cellId);
}
