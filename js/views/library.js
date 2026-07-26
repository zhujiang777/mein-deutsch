// 仓库：旅程 / 词汇 / 读听 三栏合一
//
// 为什么合并：旅程、词汇、读听是三种**内容类型**，而"今日"是它们的混合视图——
// 四个入口里有一个包含另外三个的一部分，新用户没法形成心理模型。
// 合成一栏之后，"做选择"这件事被移出主路径：今天页替你决定，想自己翻才进仓库。
//
// 三栏各自保留原来的页头，所以这个外壳不加标题——页头就是"你在哪一栏"的答案。
//
// 三栏是三条真实路由（#/path #/vocab #/readlisten），切换栏就是普通导航：
// app.js 的根视图缓存、滚动位置恢复、返回键都自然正确，也不用动任何现存的返回链。
import { el, icon } from '../ui.js';
import { renderPath } from './path.js?v=12';
import { renderVocab } from './vocab.js?v=11';
import { renderReadListen } from './readlisten.js?v=11';

const SECTIONS = [
  { id: 'path', label: '课程', icon: 'route', hash: '#/path', render: renderPath },
  { id: 'vocab', label: '词汇', icon: 'book', hash: '#/vocab', render: renderVocab },
  { id: 'readlisten', label: '读·听', icon: 'speaker', hash: '#/readlisten', render: renderReadListen },
];

export function renderLibrary(host, sectionId = 'path') {
  const index = Math.max(0, SECTIONS.findIndex(section => section.id === sectionId));
  const seg = el(`<div class="track-seg library-seg" role="tablist" aria-label="选择仓库分区"></div>`);
  seg.dataset.index = String(index);
  SECTIONS.forEach((section, i) => {
    const on = i === index;
    seg.appendChild(el(`<a class="track-tab${on ? ' active' : ''}" role="tab"
      aria-selected="${on}" href="${section.hash}">${icon(section.icon)}<span>${section.label}</span></a>`));
  });
  host.appendChild(seg);

  const pane = el(`<section class="library-pane" role="tabpanel"></section>`);
  host.appendChild(pane);
  SECTIONS[index].render(pane);
}
