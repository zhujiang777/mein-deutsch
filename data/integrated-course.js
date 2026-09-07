// 综合课程 v1。活动 ID 发布后不得复用；修改内容时递增 CONTENT_VERSION。
export const CONTENT_VERSION = 1;
// Files are generated; listening-quality review remains a human acceptance gate.
export const PILOT_RELEASE = { status:'preview', audio:'generated', listeningReview:'pending', deviceReview:'pending', sevenDayTrial:'pending' };
const line = (de, zh) => ({ de, zh });
const question = (id, target, prompt, options, answer, extra = {}) => ({ id, type: 'choice', target, prompt, options, answer, ...extra });
const response = (id, target, prompt, answers, extra = {}) => ({ id, type: 'response', target, prompt, answers, ...extra });
const material = (id, title, sentences, extra = {}) => ({ id, title, sentences, ...extra });

export const FRAMEWORK = [
  { id:'ic-u1', stage:'起步交流', title:'认识彼此', needs:[], goals:['问候与姓名','来源与住处'], grammar:['ich / du','简单问句'], lessons:['ic-01','ic-02','ic-03','ic-04'] },
  { id:'ic-u2', stage:'起步交流', title:'数量与简单购买', needs:['ic-u1'], goals:['数量','购买与价格'], grammar:['数量 + 名词','礼貌短语'], lessons:['ic-05','ic-06','ic-07','ic-08'] },
  { id:'ic-u3', stage:'描述生活', title:'家人与物品', needs:['ic-u2'], goals:['介绍他人','描述物品'], grammar:['sein / haben','冠词与复数','物主词'], lessons:[] },
  { id:'ic-u4', stage:'描述生活', title:'日常作息', needs:['ic-u3'], goals:['描述一天','询问时间'], grammar:['现在时','时间','可分动词'], lessons:[] },
  { id:'ic-u5', stage:'参与活动', title:'兴趣与邀约', needs:['ic-u4'], goals:['表达喜好','约定活动'], grammar:['否定','情态动词','问句'], lessons:[] },
  { id:'ic-u6', stage:'参与活动', title:'城市出行', needs:['ic-u5'], goals:['问路','理解交通信息'], grammar:['方向','常用介词'], lessons:[] },
  { id:'ic-u7', stage:'处理需求', title:'住所', needs:['ic-u6'], goals:['描述房间','说明位置'], grammar:['地点','常见第三格'], lessons:[] },
  { id:'ic-u8', stage:'处理需求', title:'饮食与购物', needs:['ic-u7'], goals:['表达选择','提出具体需求'], grammar:['第四格','比较与数量'], lessons:[] },
  { id:'ic-u9', stage:'沟通办事', title:'身体与求助', needs:['ic-u8'], goals:['描述不适','理解建议'], grammar:['请求与命令式','常见代词'], lessons:[] },
  { id:'ic-u10', stage:'沟通办事', title:'预约与留言', needs:['ic-u9'], goals:['预约','填写表格与写短消息'], grammar:['礼貌表达','时间介词'], lessons:[] },
  { id:'ic-u11', stage:'综合运用', title:'近期经历', needs:['ic-u10'], goals:['描述过去的事情'], grammar:['war / hatte','完成时'], lessons:[] },
  { id:'ic-u12', stage:'综合运用', title:'日常综合交流', needs:['ic-u11'], goals:['综合听说读写','A1 题型检查'], grammar:['并列连词','综合复现'], lessons:[] },
];

const lessons = [
 { id:'ic-01', title:'问候与名字', unit:'ic-u1', words:['w001','w016','w020','w238','w006'], grammarRefs:['g01','g05'],
   focus:['name'], pronunciation:'注意 heißen 的 ei；听示范后，跟读自己的名字介绍。',
   text:[line('Hallo! Ich heiße Anna.','你好！我叫安娜。'),line('Hallo, Anna! Ich heiße Max.','你好，安娜！我叫马克斯。'),line('Wie heißt du?','你叫什么名字？'),line('Ich heiße Max.','我叫马克斯。'),line('Tschüss, Max!','再见，马克斯！')],
   rule:'介绍名字用 Ich heiße …；询问对方用 Wie heißt du?。ich 后是 heiße，du 后是 heißt。du 用在熟悉、非正式的交流中。',
   example:'Ich heiße Anna.',
   checks:[question('meaning','reading','对话中出现了哪两个人？',['Anna 和 Max','Anna 和 Tom'],0),question('form','name','Ich ___ Anna.',['heiße','heißt'],0,{explain:'ich 配 heiße。'}),response('transfer','name','他叫 Tom。请替他写一句自我介绍。',['Ich heiße Tom.'],{explain:'Ich heiße + 名字。'})],
   speak:'用自己的名字介绍自己，再问对方叫什么。', model:'Ich heiße Anna. Wie heißt du?',
   reviews:[response('r1','name','你是 Lena。写一句介绍名字的话。',['Ich heiße Lena.']),response('r2','name','问新同学叫什么名字。',['Wie heißt du?']),response('r3','name','你是 Mia。先介绍名字，再问对方名字。',['Ich heiße Mia. Wie heißt du?'])] },
 { id:'ic-02', title:'来自哪里', unit:'ic-u1', words:['w017','w022','w023','w235','w245'], grammarRefs:['g02','g05'], focus:['origin','name'], pronunciation:'听清 komme 和 kommst 的结尾，再跟读短句。',
   text:[line('Hallo! Ich heiße Lena.','你好！我叫莱娜。'),line('Woher kommst du?','你来自哪里？'),line('Ich komme aus China.','我来自中国。'),line('Ich komme aus Deutschland.','我来自德国。'),line('Kommst du auch aus China?','你也来自中国吗？')],
   rule:'说来自哪里：Ich komme aus …。问来源：Woher kommst du?。先把 aus China、aus Deutschland 当作整体表达使用。',example:'Ich komme aus China.',
   checks:[question('meaning','listening','听这句话：说话人来自哪里？',['中国','德国'],0,{audioText:'Ich komme aus China.'}),question('form','origin','Woher ___ du?',['komme','kommst'],1,{explain:'du 配 kommst。'}),response('transfer','origin','你来自德国。写一句回答。',['Ich komme aus Deutschland.'])],
   speak:'介绍自己的名字和来自哪里。',model:'Ich heiße Lena. Ich komme aus China.',
   reviews:[response('r1','origin','问对方来自哪里。',['Woher kommst du?']),response('r2','origin','你来自中国，写出回答。',['Ich komme aus China.']),response('r3','origin','你叫 Tom，来自德国。写两句话。',['Ich heiße Tom. Ich komme aus Deutschland.'])] },
 { id:'ic-03', title:'住在哪里', unit:'ic-u1', words:['w018','w234','w247','w248','w241'], grammarRefs:['g02','g05'], focus:['residence','origin'], pronunciation:'wohnen 的 w 听起来与英语 v 接近；以标准音为准。',
   text:[line('Wo wohnst du?','你住在哪里？'),line('Ich wohne in Berlin.','我住在柏林。'),line('Ich wohne auch in Berlin.','我也住在柏林。'),line('Und woher kommst du?','那你来自哪里？'),line('Ich komme aus China.','我来自中国。')],
   rule:'问住处：Wo wohnst du?。回答：Ich wohne in …。Wo 问位置，Woher 问来源；in Berlin 先作为整体短语学习。',example:'Ich wohne in Berlin.',
   checks:[question('meaning','reading','对话中的住处是哪里？',['Berlin','China'],0),question('form','residence','___ wohnst du?',['Wo','Woher'],0,{explain:'住在哪里问 Wo；来自哪里问 Woher。'}),response('transfer','residence','你住在 Hamburg，写一句回答。',['Ich wohne in Hamburg.'])],
   speak:'回答你来自哪里、现在住在哪里。',model:'Ich komme aus China. Ich wohne in Berlin.',
   reviews:[response('r1','residence','问对方住在哪里。',['Wo wohnst du?']),response('r2','residence','你住在 Bonn，写一句回答。',['Ich wohne in Bonn.']),response('r3','residence','你来自中国、住在 Hamburg，写两句话。',['Ich komme aus China. Ich wohne in Hamburg.'])] },
 { id:'ic-04', title:'交换个人信息', unit:'ic-u1', words:['w003','w011','w012','w008'], grammarRefs:['g01','g02','g05'], focus:['name','origin','residence'], checkpoint:true, pronunciation:'问句与回答各听一次，模仿整句的节奏，不要求固定腔调。',
   text:[line('Guten Tag! Ich heiße Mia.','你好！我叫米娅。'),line('Ich heiße Paul. Woher kommst du?','我叫保罗。你来自哪里？'),line('Ich komme aus China. Und du?','我来自中国。你呢？'),line('Ich komme aus Deutschland. Wohnst du in Berlin?','我来自德国。你住在柏林吗？'),line('Nein. Ich wohne in Bonn.','不。我住在波恩。')],
   rule:'已有信息不用每次重复：Und du? 可以把同一个问题问回去。Ja / Nein 用于回答是不是；补上一句信息会更清楚。', example:'Nein. Ich wohne in Bonn.',
   checks:[question('meaning','reading','Mia 住在哪里？',['Berlin','Bonn'],1),question('new-listen','listening','听新朋友介绍：她来自哪里？',['德国','中国'],0,{audioText:'Hallo! Ich heiße Eva. Ich komme aus Deutschland. Ich wohne in Hamburg.'}),response('transfer','residence','你叫 Leo，来自中国，住在 Berlin。写出三句话。',['Ich heiße Leo. Ich komme aus China. Ich wohne in Berlin.']),response('ask','name','问对方的名字。',['Wie heißt du?'])],
   speak:'不看范文，介绍自己的名字、来源和住处。',model:'Ich heiße Mia. Ich komme aus China. Ich wohne in Bonn.',
   reviews:[response('r1','origin','问对方来自哪里，再问住在哪里。',['Woher kommst du? Wo wohnst du?']),response('r2','name','你叫 Eva，来自德国，住在 Bonn。写三句话。',['Ich heiße Eva. Ich komme aus Deutschland. Ich wohne in Bonn.']),response('r3','residence','你不住在 Berlin，而住在 Hamburg。用两句话回答 Wohnst du in Berlin?',['Nein. Ich wohne in Hamburg.'])] },
 { id:'ic-05', title:'数量与常见商品', unit:'ic-u2', words:['w079','w078','w080','w035','w036'], grammarRefs:['g03','g04','g14'], focus:['quantity'], pronunciation:'听清 zwei 的开头，再与 drei 对照。',
   text:[line('Guten Tag! Zwei Brötchen, bitte.','你好！请给我两个小面包。'),line('Zwei Brötchen?','两个小面包？'),line('Ja, bitte.','是的，谢谢。'),line('Danke!','谢谢！')],
   rule:'数量放在名词前：zwei Brötchen。Brötchen 的单数与复数拼写相同：das Brötchen / die Brötchen。bitte 表示礼貌请求。数字先熟悉 0–6：null, eins, zwei, drei, vier, fünf, sechs。',example:'Zwei Brötchen, bitte.',
   checks:[question('meaning','listening','客人要几个小面包？',['两个','三个'],0,{audioText:'Zwei Brötchen, bitte.'}),question('number','listening','听到的是哪个数字？',['4','6','5'],1,{audioText:'sechs'}),response('transfer','quantity','请要三个小面包。',['Drei Brötchen, bitte.'])],
   speak:'选择两个或三个小面包，向店员提出需求。',model:'Drei Brötchen, bitte.',
   reviews:[response('r1','quantity','请要四个小面包。',['Vier Brötchen, bitte.']),response('r2','quantity','请要五个小面包。',['Fünf Brötchen, bitte.']),response('r3','quantity','请要六个小面包。',['Sechs Brötchen, bitte.'])] },
 { id:'ic-06', title:'提出购买需求', unit:'ic-u2', words:['w081','w082','w009','w258','w037'], grammarRefs:['g08','g06'], focus:['request','quantity'], pronunciation:'Kaffee 的重音听示范；本课只模仿词和短句，不背重音口诀。',
   text:[line('Guten Tag! Was möchten Sie?','您好！您想要什么？'),line('Ich möchte einen Kaffee, bitte.','我想要一杯咖啡，谢谢。'),line('Und zwei Brötchen?','再要两个小面包吗？'),line('Ja, bitte. Danke!','是的，谢谢！')],
   rule:'Ich möchte … 是礼貌地表达想要。先整体学习 einen Kaffee / einen Tee，冠词变化以后系统学习。店员用 Sie 称呼顾客；你可以直接回答需求。继续数字 7–10：sieben, acht, neun, zehn。',example:'Ich möchte einen Tee, bitte.',
   checks:[question('meaning','reading','客人要什么饮料？',['茶','咖啡'],1),question('number','listening','听到的是哪个数字？',['7','9','10'],1,{audioText:'neun'}),response('transfer','request','用 Ich möchte 礼貌地要一杯茶。',['Ich möchte einen Tee, bitte.','Ich möchte einen Tee.'])],
   speak:'向店员要一杯咖啡或茶，再加两个小面包。',model:'Ich möchte einen Tee und zwei Brötchen, bitte.',
   reviews:[response('r1','request','用 Ich möchte 要一杯咖啡。',['Ich möchte einen Kaffee, bitte.','Ich möchte einen Kaffee.']),response('r2','request','要一杯茶和三个小面包。',['Ich möchte einen Tee und drei Brötchen, bitte.','Einen Tee und drei Brötchen, bitte.']),response('r3','request','用 Ich möchte 要一杯咖啡和四个小面包。',['Ich möchte einen Kaffee und vier Brötchen, bitte.'])] },
 { id:'ic-07', title:'听懂简单价格', unit:'ic-u2', words:['w364','w129','w240','w038','w039'], grammarRefs:['g05'], focus:['price','quantity'], pronunciation:'区分 vier 和 vierzehn，先听清，再看数字。',
   text:[line('Was kostet das?','这多少钱？'),line('Das kostet vier Euro.','这要四欧元。'),line('Vier Euro?','四欧元？'),line('Ja, vier Euro.','是的，四欧元。'),line('Danke!','谢谢！')],
   rule:'问价格可用 Was kostet das?，也可以说 Wie viel kostet das?。金额后用 Euro。本课只练整数金额。数字 11–20：elf, zwölf, dreizehn, vierzehn, fünfzehn, sechzehn, siebzehn, achtzehn, neunzehn, zwanzig。',example:'Das kostet zwölf Euro.',
   checks:[question('meaning','listening','这件商品多少钱？',['4 欧元','14 欧元'],0,{audioText:'Das kostet vier Euro.'}),question('number','listening','新的一笔金额是多少？',['12 欧元','20 欧元','13 欧元'],1,{audioText:'Das kostet zwanzig Euro.'}),response('transfer','price','写一句话询问价格。',['Was kostet das?','Wie viel kostet das?'])],
   speak:'先问价格，再跟读听到的金额。',model:'Was kostet das? Das kostet vierzehn Euro.',
   reviews:[question('r1','price','听到的价格是多少？',['12 欧元','14 欧元'],0,{audioText:'Das kostet zwölf Euro.'}),question('r2','price','听到的价格是多少？',['16 欧元','17 欧元'],1,{audioText:'Das kostet siebzehn Euro.'}),response('r3','price','用 Wie viel 开头询问价格。',['Wie viel kostet das?'])] },
 { id:'ic-08', title:'完成一次购买', unit:'ic-u2', words:['w010','w254','w007','w242'], grammarRefs:['g05','g08'], focus:['request','price','quantity'], checkpoint:true, pronunciation:'没听清时可以说 Wie bitte?，不要求第一次就听懂。',
   text:[line('Guten Tag! Ich möchte einen Tee und zwei Brötchen, bitte.','您好！我想要一杯茶和两个小面包。'),line('Das kostet fünf Euro.','一共五欧元。'),line('Wie bitte?','请再说一遍？'),line('Fünf Euro.','五欧元。'),line('Danke. Auf Wiedersehen!','谢谢。再见！')],
   rule:'没听清就用 Wie bitte? 请求重复。可以重复金额确认信息。或者用 oder 提供选择，如 Kaffee oder Tee?。',example:'Kaffee oder Tee?',
   checks:[question('meaning','reading','客人为什么说 Wie bitte?',['请对方重复','取消购买'],0),question('new-listen','listening','听一笔新的价格。',['6 欧元','16 欧元','7 欧元'],0,{audioText:'Ein Kaffee und drei Brötchen. Das kostet sechs Euro.'}),response('transfer','request','用 Ich möchte 要一杯咖啡和三个小面包。',['Ich möchte einen Kaffee und drei Brötchen, bitte.']),response('repeat','price','没听清价格，怎么请求重复？',['Wie bitte?'])],
   speak:'完成购买：提出需求、问价格、没听清时请求重复。',model:'Ich möchte einen Kaffee und zwei Brötchen, bitte. Was kostet das? Wie bitte?',
   reviews:[response('r1','request','用 Ich möchte 要一杯茶和四个小面包。',['Ich möchte einen Tee und vier Brötchen, bitte.']),question('r2','price','这次的价格是多少？',['8 欧元','18 欧元'],1,{audioText:'Das kostet achtzehn Euro.'}),response('r3','price','先询问价格，再请求重复。',['Was kostet das? Wie bitte?','Wie viel kostet das? Wie bitte?'])] },
];

export const PILOT_LESSONS = lessons.map((l, index) => ({ ...l, version:CONTENT_VERSION, order:index,
  needs:index ? [lessons[index-1].id] : [], minutes:[10,15],
  material:material(`${l.id}-text`,l.title,l.text),
  activities:[
    {id:'input',type:'material',target:'understanding'},
    l.checks[0],
    {id:'rule',type:'rule',target:l.focus[0]},
    ...l.words.map(id=>({id:`word-${id}`,type:'word',target:'word-recognition',wordId:id})),
    ...l.checks.slice(1),
    {id:'speak',type:'speak',target:'oral-self-report',prompt:l.speak,model:l.model},
  ],
}));
export const PILOT_MATERIALS = [
 material('ic-read-1','一位新同学',[line('Hallo! Ich heiße Sara.','你好！我叫萨拉。'),line('Ich komme aus Deutschland.','我来自德国。'),line('Ich wohne in Bonn. Und du?','我住在波恩。你呢？')],{unit:'ic-u1',after:'ic-02',fresh:true,practice:question('check','reading','Sara 住在哪里？',['Bonn','Berlin'],0)}),
 material('ic-read-2','在 Berlin 见面',[line('Hallo! Wie heißt du?','你好！你叫什么名字？'),line('Ich heiße Ben. Ich wohne in Berlin.','我叫本。我住在柏林。'),line('Ich wohne auch in Berlin.','我也住在柏林。')],{unit:'ic-u1',after:'ic-03',fresh:true,practice:question('check','reading','两人都住在 Berlin 吗？',['是','不是'],0)}),
 material('ic-read-3','一杯茶',[line('Guten Tag! Einen Tee, bitte.','您好！请给我一杯茶。'),line('Das kostet drei Euro.','三欧元。'),line('Danke! Auf Wiedersehen!','谢谢！再见！')],{unit:'ic-u2',after:'ic-06',fresh:true,practice:question('check','reading','这杯茶多少钱？',['3 欧元','2 欧元'],0)}),
 material('ic-read-4','确认价格',[line('Vier Brötchen, bitte.','请给我四个小面包。'),line('Das kostet acht Euro.','八欧元。'),line('Wie bitte?','请再说一遍？'),line('Acht Euro.','八欧元。')],{unit:'ic-u2',after:'ic-07',fresh:true,practice:question('check','reading','价格是多少？',['18 欧元','8 欧元'],1)}),
];
export const KNOWLEDGE_MAP = [
 {id:'name',title:'介绍与询问姓名',first:'ic-01',needs:[],revisit:['ic-02','ic-04'],check:'ic-04'},
 {id:'origin',title:'来源：kommen aus',first:'ic-02',needs:['name'],revisit:['ic-03','ic-04'],check:'ic-04'},
 {id:'residence',title:'住处：wohnen in',first:'ic-03',needs:['origin'],revisit:['ic-04'],check:'ic-04'},
 {id:'quantity',title:'数量与名词',first:'ic-05',needs:[],revisit:['ic-06','ic-07','ic-08'],check:'ic-08'},
 {id:'request',title:'礼貌购买：ich möchte',first:'ic-06',needs:['quantity'],revisit:['ic-08'],check:'ic-08'},
 {id:'price',title:'价格与请求重复',first:'ic-07',needs:['quantity'],revisit:['ic-08'],check:'ic-08'},
];
export const NUMBER_AUDIO = ['null','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn','zwanzig'];
export const findPilotLesson = id => PILOT_LESSONS.find(l=>l.id===id);
export function pilotAudioTexts() {
 const texts=new Set(NUMBER_AUDIO);
 for(const l of PILOT_LESSONS) {
   l.text.forEach(s=>texts.add(s.de)); texts.add(l.example); texts.add(l.model);
   [...l.checks,...l.reviews].forEach(s=>{if(s.audioText)texts.add(s.audioText);(s.answers||[]).forEach(t=>texts.add(t));});
 }
 for(const m of PILOT_MATERIALS) m.sentences.forEach(s=>texts.add(s.de));
 return [...texts];
}
