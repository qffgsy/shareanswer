'use strict';
const DATA = window.PREVIEW_CORPUS;
function groupIndex(r){const g=r.genre||'文言文';return g==='文言文'?0:g==='古诗'?1:2}
function occurrences(text,q){const found=[];if(!q)return found;let i=0;while((i=text.indexOf(q,i))!==-1){found.push(i);i+=q.length}return found}
function highlight(node,text,q){if(!q){node.append(document.createTextNode(text));return}let p=0,i;while((i=text.indexOf(q,p))!==-1){node.append(document.createTextNode(text.slice(p,i)));let m=document.createElement('mark');m.textContent=q;node.append(m);p=i+q.length}node.append(document.createTextNode(text.slice(p)))}
const REVERSE_ALIASES=[
 ['推测语气',['推测','揣测','揣度','猜测','推断','大概','恐怕','想必','猜想','估摸','不太确定','也许','或许']],
 ['转折关系',['转折','但是','然而','却','不过']],
 ['因果关系',['因果','因为','所以','因此','由于']],
 ['递进关系',['递进','而且','更进一步','不仅','不但']],
 ['承接关系',['承接','接着','然后','于是']],
 ['假设关系',['假设','假如','如果','倘若']],
 ['让步关系',['让步','即使','虽然']],
 ['反问语气',['反问','难道','难不成']],
 ['感叹语气',['感叹','叹息','赞叹']],
 ['疑问语气',['疑问','询问']],
 ['祈使语气',['祈使','劝告','商量','命令']],
 ['宾语前置标志',['宾语前置标志']],
 ['宾语前置',['宾语前置']],
 ['取消句子独立性',['取消句子独立性','取消独立性','主谓之间','主谓间','取消句子的独立性']],
 ['被动标志',['被动的虚词','被动标志','表被动']],
 ['被动句',['被动']],
 ['使动用法',['使动']],['意动用法',['意动']],['名词作状语',['名词作状语','名词做状语']],
 ['通假字',['通假','通用字','通借']],['判断句',['判断句']],['省略句',['省略句']],
 ['定语后置',['定语后置']],['状语后置',['状语后置','介宾后置']],
 ['结构助词',['结构助词','所属','修饰关系','修饰']],['指代',['指代','指示代词','人称代词']]
];
const GLOSS_FAMILIES=[['前往','到','往','去','到达'],['喜欢','喜爱','爱好'],['离开','离去'],['全','都','全部'],['没有','无','未曾'],['已经','已'],['才','方'],['仅仅','只','只是'],['就','于是'],['美好','美丽'],['快','迅速','快速'],['看','看见','见'],['听','听见'],['说','告诉'],['担心','忧虑'],['认为','以为']];
const normalizeReverse=s=>(s||'').replace(/[\p{P}\p{Z}\s]/gu,'');
function parseReverseQuery(raw){
 const q=raw.trim(),p={raw:q,tags:[],pos:'',object:'',term:'',titles:[],unknownTitle:'',pattern:[],fragment:'',glosses:[],intent:'原文或记忆片段',recognized:[]};
 const titles=[...new Set(DATA.map(r=>r.title))].sort((a,b)=>b.length-a.length);
 const quotedTitles=[...q.matchAll(/《([^》]+)》/g)].map(m=>m[1]);
 for(const t of quotedTitles){const hits=titles.filter(x=>x===t||x.replace(/（.*?）/g,'')===t||x.startsWith('《'+t+'》'));if(hits.length)p.titles.push(...hits);else p.unknownTitle=t}
 if(!p.titles.length&&!p.unknownTitle){for(const t of titles){if(q.includes(t)&&t.length>1&&!p.titles.some(x=>x.includes(t)))p.titles.push(t)}}
 let work=q;for(const t of p.titles)work=work.replaceAll(t,'');work=work.replace(/《[^》]*》/g,'');
 // Explicit contrast: do not turn a negated function into a positive condition.
 work=work.replace(/(?:不是|不要|不含|排除)([^，。]*?)(?=而是|只要|，|。|$)/g,'');
 const quotes=[...work.matchAll(/[“‘「'"]([^”’」'"]+)[”’」'"]/g)].map(m=>m[1]);
 const memory=/记得|记忆|有一句|哪篇|哪首|讲的是|讲|原文.*(?:找|是)|找.*原文/.test(work);
 let classification=work.replace(/[“‘「'"]([^”’」'"]+)[”’」'"]/g,(_,s)=>s.length>6?'':s);
 for(const [tag,aliases] of REVERSE_ALIASES){const matched=aliases.find(a=>classification.includes(a));if(matched){p.tags.push(tag);p.recognized.push(matched+' → '+tag)}}
 const grammarPattern=work.match(/何\s*(?:…+|\.{2,}|.*?结构.*?|\s+)\s*之有/);
 if(grammarPattern||/何[^。？！]{0,6}之有.*(?:句式|结构)/.test(work)){p.tags.push('宾语前置');p.pattern=['何','之有']}
 if(/为\s*(?:…+|\.{2,}|\s+)\s*所/.test(work)){p.tags.push('被动句');p.pattern=['为','所']}
 if(/之有.*结构|结构.*之有/.test(work)){p.tags.push('宾语前置');p.pattern=['之有']}
 const posMatch=classification.match(/(?:作|做|是|的|^|作为|用作)?(副词|代词|介词|连词|助词|叹词|动词|形容词|名词)(?!作状语|做状语)/);
 if(posMatch)p.pos=posMatch[1];
 if(/虚词/.test(work))p.object='虚词';else if(p.pos)p.object=p.pos;
 const termMatch=work.match(/(?:含有|包含|含|带有)[“‘「'"]([^”’」'"]{1,6})[”’」'"]/)||work.match(/(?:作|做|用作|作为)(?:副词|代词|介词|连词|助词|动词|名词|形容词)的[“‘「'"]?([\p{Script=Han}]{1,3})(?:[”’」'"]|$)/u)||work.match(/的[“‘「'"]?([之其而以于焉乃则者所也乎矣且若为盖殆遂])(?:[”’」'"])?$/);
 if(termMatch)p.term=termMatch[1];
 if(!p.term){const plainTerm=work.match(/(?:含有|包含|带有)([之其而以于焉乃则者所也乎矣且若为盖殆遂])(?:且|并|而且|并且|的|表)/)||work.match(/^([之其而以于焉乃则者所也乎矣且若为盖殆遂])(?:字)?(?:表|作|用作)/);if(plainTerm)p.term=plainTerm[1]}
 const translated=work.match(/(?:翻译成|译成|译为|翻译为|相当于)[“‘「'"]?([^”’」'"，。]{1,12})/);
 if(translated){p.translation=true;let meaning=translated[1].replace(/的(?:虚词|词|字).*$/,'').trim();p.glosses=[meaning];p.intent='现代释义 → 文言形式';if(meaning==='的')p.tags.push('结构助词')}
 if(!translated&&/有点像[“‘「'"]?的[”’」'"]?的|表示(?:所属|修饰)/.test(work))p.tags.push('结构助词');
 if(/(?:表示|意思是|意义是|释义为|意为|相当于|像)[“‘「'"]?(?:到[、，或和及/\s]*往|往[、，或和及/\s]*到|前往|到达)/.test(work)){
  p.tags.push('前往');p.intent='现代意义 → 文言字词';
 }
 if(!p.tags.length&&!p.glosses.length){const g=work.match(/(?:表示|意思是|意义是|释义为|意为|相当于|翻译成|译成|有点像|像)[“‘「'"]?(.+?)(?:[”’」'"]|的(?:字词|虚词|词语|词|字)|$)/);if(g){p.glosses=g[1].replace(/(.+)的$/,'$1').split(/[、，或/]/).map(s=>s.trim()).filter(Boolean);p.intent='现代意义 → 文言字词'}}
 if(p.glosses.length===1&&p.glosses[0]==='的')p.tags.push('结构助词');
 if(p.translation&&p.glosses[0]!=='的')p.tags=[];
 if(p.pos&&!p.tags.length)p.intent='词性＋字词 → 例句';
 if(p.tags.length)p.intent=p.pattern.length?'句式特征 → 例句':p.pos?'词性＋功能 → 例句':'语法、语气或意义 → 字词与例句';
 const isSemantic=!!(p.tags.length||p.pos||p.term||p.glosses.length||p.pattern.length);
 if(!isSemantic||memory){
  const fragment=quotes.filter(x=>x!==p.term).sort((a,b)=>b.length-a.length)[0]||work.replace(/(?:我记得|我记着|我想找|帮我找|请找|有一句|有一段|一句|讲的是|讲|好像是|大概是|说的是|原文|在哪篇|哪篇课文|出自哪里|出自哪篇|是什么|的句子|的原文)/g,'').replace(/^[，。：“”‘’\s]+|[，。？！：“”‘’\s]+$/g,'');
  if(fragment&&!['词','虚词','字词','句式'].includes(fragment))p.fragment=fragment;
  if(memory&&!/(?:语气|用法|关系|句式|作.*词|表示)/.test(work)){p.tags=[];p.pos='';p.glosses=[];p.intent='记忆碎片 → 原文'}
 }
 p.tags=[...new Set(p.tags)];p.titles=[...new Set(p.titles)];
 return p;
}
const get = id => document.getElementById(id);
const books = window.PREVIEW_VOLUME_ORDER;
const entries = window.PREVIEW_EXAM.entries;
const searchEngine = window.ExamSearch.create({articles: DATA, entries, parseBase: parseReverseQuery});
const groups = ['古文', '古诗', '其他形式'];
const filterNames = ['stage', 'volume', 'genre', 'collection'];
const bookOrder = new Map(Object.values(books).flat().map((id, index) => [id, index]));
let activeArticle = null;
let result = null;

function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}

function options(id, values) {
  const select = get(id);
  const oldValue = select.value;
  select.length = 1;
  for (const value of new Set(values)) if (value) select.add(new Option(value, value));
  if (Array.from(select.options).some(o => o.value === oldValue)) select.value = oldValue;
}

function refreshBooks() {
  const stage = get('stage').value;
  const inStage = new Set(DATA.filter(a => !stage || stage === a.stage).map(a => a.volume));
  options('volume', Object.keys(books).filter(volume => inStage.has(volume)));
}

function literalSearch(articles, query, mode) {
  const rows = articles.filter(a => {
    if (a.text.includes(query)) return true;
    if (mode === 'text') return false;
    return [a.title, a.author, a.work_source, ...a.annotations.flatMap(n => [n.term, n.meaning, n.explanation])]
      .some(s => s.includes(query));
  });
  return {rows, byArticle:new Map(), external:[], parsed:null};
}

function collectResults() {
  const query = get('query').value.trim();
  const scope = get('searchScope').value;
  const articles = DATA.filter(a => filterNames.every(key => !get(key).value || get(key).value === a[key])
    && (!get('annotatedOnly').checked || a.annotations.length));
  let found;
  if (scope !== 'reverse') {
    found = literalSearch(articles, query, scope);
  } else {
    const category = get('examCategory').value;
    const external = get('includeExternal').checked && !get('annotatedOnly').checked && filterNames.every(id => !get(id).value);
    found = searchEngine.search(query || category, {
      ids:new Set(articles.map(a=>a.id)), external, candidates:false, fuzzy:get('fuzzySearch').checked
    });
    if (category) {
      for (const [id, hits] of found.byArticle) {
        const filtered = hits.filter(hit => hit.categories.includes(category));
        if (filtered.length) found.byArticle.set(id, filtered);
        else found.byArticle.delete(id);
      }
      found.rows = found.rows.filter(a => found.byArticle.has(a.id));
      found.external = found.external.filter(hit => hit.categories.includes(category));
    } else if (query && !found.parsed.unknownTitle) {
      // An author, work or partial title is also a valid search in the default mode.
      const existing = new Set(found.rows.map(a => a.id));
      for (const a of articles) {
        if (!existing.has(a.id) && [a.title, a.author, a.work_source].some(s => s.includes(query))) {
          found.rows.push(a);
        }
      }
    }
  }
  const score = a => found.byArticle.get(a.id)?.[0]?.priority || 0;
  found.rows.sort((a,b) => groupIndex(a)-groupIndex(b) || score(b)-score(a) || bookOrder.get(a.id)-bookOrder.get(b.id));
  return {...found, query, scope};
}

function evidenceText(hit) {
  return [hit.basis, hit.term, hit.pos, ...hit.tags, hit.meaning, hit.example, hit.explanation]
    .filter(Boolean).join(' · ');
}

function evidenceCard(hit) {
  const card = node('div', undefined, 'sense-card');
  const fragment = hit.id.startsWith('fragment:');
  const title = fragment ? (hit.approximate ? '近似原句' : '原文命中') :
    [hit.term, hit.pos, hit.meaning].filter(Boolean).join(' · ');
  card.append(node('h4', title), node('blockquote', hit.example));
  if (!fragment) card.append(node('p', hit.explanation));
  const source = hit.external ? '课外例证《'+hit.title+'》' : hit.basis;
  card.append(node('small', [source, ...hit.tags, hit.match_reason].filter(Boolean).join(' · ')));
  return card;
}

function openGloss(article, note) {
  get('noteTitle').textContent = note.term;
  get('noteContent').textContent = note.meaning + '。' + note.explanation;
  get('noteSource').textContent = '项目释读 · 《' + article.title + '》 · ' + article.volume;
  get('noteDialog').showModal();
}

function renderBody(article, query) {
  const body = get('text');
  const chars = Array.from(article.text);
  let cursor = 0;
  for (const note of article.annotations) {
    highlight(body, chars.slice(cursor, note.start).join(''), query);
    const button = node('button', undefined, 'ann');
    button.type = 'button';
    button.setAttribute('aria-label', '查看“' + note.term + '”的项目释读');
    highlight(button, chars.slice(note.start, note.end).join(''), query);
    button.onclick = () => openGloss(article, note);
    body.append(button);
    const item = node('li');
    const link = node('button', note.term);
    link.onclick = () => openGloss(article, note);
    item.append(link, node('p', note.meaning + '。' + note.explanation));
    get('notesList').append(item);
    cursor = note.end;
  }
  highlight(body, chars.slice(cursor).join(''), query);
}

function showArticle(article) {
  activeArticle = article || null;
  get('text').replaceChildren();
  get('notesList').replaceChildren();
  get('message').textContent = '';
  get('annotationsDetails').open = false;
  const notes = article?.annotations || [];
  get('scope').hidden = !notes.length;
  get('annotationsDetails').hidden = !notes.length;
  get('annotationsSummary').textContent = '本篇项目释读（' + notes.length + '）';
  get('copy').disabled = get('download').disabled = !article;
  get('title').textContent = article?.title || (result.external.length ? '请查看下方课外例证' : '没有匹配篇目');
  get('meta').textContent = article ? [article.author, article.dynasty, article.volume, article.genre].join(' · ') : '';
  get('sourceDetails').textContent = article ? '篇目来源　' + article.work_source : '';
  const matches = get('matchedExamples');
  matches.replaceChildren();
  const hits = result.byArticle.get(article?.id) || [];
  matches.hidden = !hits.length;
  if (hits.length) {
    matches.append(node('h3', '本篇匹配依据'));
    for (const hit of hits) matches.append(evidenceCard(hit));
  }
  if (article) renderBody(article, result.scope === 'reverse' ? (result.parsed?.fragment || '') : result.query);
  for(const button of get('list').querySelectorAll('button')) {
    const selected = button.dataset.id === article?.id;
    button.classList.toggle('active', selected);
    if (selected) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  }
}

function snippet(article) {
  const hit = result.byArticle.get(article.id)?.[0];
  if (hit) return (hit.approximate ? '近似 · ' : '') + hit.example.slice(0, 62);
  const at = article.text.indexOf(result.query);
  if (at < 0) return '篇目信息或释读命中';
  const start = Math.max(0, at - 8);
  return (start ? '…' : '') + article.text.slice(start, at + result.query.length + 16).replace(/\n/g, ' ');
}

function render(preferredId) {
  result = collectResults();
  const counts = groups.map((_,i) => result.rows.filter(a => groupIndex(a) === i).length);
  const list = document.createDocumentFragment();
  let group = -1;
  for (const a of result.rows) {
    const index = groupIndex(a);
    if (index !== group) {
      list.append(node('h3', groups[index] + '（' + counts[index] + '）', 'result-group'));
      group = index;
    }
    const button = node('button', a.title);
    button.type = 'button';
    button.dataset.id = a.id;
    button.append(node('small', a.volume + ' · ' + a.genre));
    if (result.query) button.append(node('span', snippet(a), 'result-snippet'));
    button.onclick = () => showArticle(a);
    list.append(button);
  }
  get('list').replaceChildren(list);
  get('status').textContent = '找到 ' + result.rows.length + ' 篇　' + groups.map((g,i)=>g+' '+counts[i]).join(' · ');
  get('reversePanel').hidden = result.scope !== 'reverse';
  const p = result.parsed;
  get('queryInterpretation').textContent = p && (result.query || get('examCategory').value) ?
    [p.intent, p.unknownTitle ? '未收录《'+p.unknownTitle+'》' : p.titles.join('、'), ...p.tags, ...p.glosses, ...p.categories].filter(Boolean).join(' · ') : '';
  const outside = get('externalExamples');
  outside.replaceChildren();
  if (result.external.length) {
    outside.append(node('h3','课外例证'));
    for (const hit of result.external) outside.append(evidenceCard(hit));
  }
  get('exportResults').disabled = !result.rows.length && !result.external.length;
  get('exportMessage').textContent = '';
  showArticle(result.rows.find(a=>a.id===preferredId) || result.rows[0]);
}

function fullText(a) {
  const lines = [a.title, [a.author, a.dynasty, a.volume, a.genre].join(' · '), a.work_source, '', a.text];
  if (a.annotations.length) {
    lines.push('', '【项目释读】');
    for (const n of a.annotations) lines.push(n.term + '　' + n.meaning + '。' + n.explanation);
  }
  return lines.join('\n');
}

function saveText(filename, content) {
  const url = URL.createObjectURL(new Blob(['\uFEFF',content], {type:'text/plain;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace(/[<>:"/\\|?*\u0000-\u001f]/gu,'_') + '.txt';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url), 1500);
}

function exportResults() {
  const criteria = [get('searchScope').selectedOptions[0].textContent,
    ...filterNames.map(id=>get(id).value), get('annotatedOnly').checked ? '有项目释读' : ''];
  if (result.scope === 'reverse') criteria.push(get('examCategory').value);
  const lines = ['初高中古诗文语料库 · 检索结果', '检索　' + (result.query || '全部'), '范围　'+criteria.filter(Boolean).join(' · '),
    '匹配篇目　' + result.rows.length];
  for (const [index, name] of groups.entries()) {
    const selected = result.rows.filter(a=>groupIndex(a)===index);
    if (!selected.length) continue;
    lines.push('', '【'+name+'】 共'+selected.length+'篇');
    for (const a of selected) {
      lines.push('', fullText(a));
      const hits = result.byArticle.get(a.id) || [];
      if (hits.length) lines.push('【检索依据】', ...hits.map(evidenceText));
    }
  }
  if (result.external.length) {
    lines.push('', '【课外例证】', ...result.external.map(x=>'《'+x.title+'》 '+evidenceText(x)));
  }
  saveText('语料库搜索_'+(result.query.slice(0,24)||'全部')+'_'+result.rows.length+'篇', lines.join('\n'));
  get('exportMessage').textContent = '已生成 ' + result.rows.length + ' 篇的检索结果。';
}

options('stage', ['初中','高中']);
refreshBooks();
options('genre', DATA.map(a=>a.genre));
options('collection', DATA.map(a=>a.collection));
options('examCategory', searchEngine.entries.flatMap(x=>x.categories));
get('headline').textContent = DATA.length + ' 篇古诗文 · 按初高中教材册次、原文片段与语法功能检索';
get('query').addEventListener('input', ()=>render());
for (const id of [...filterNames, 'searchScope','examCategory','fuzzySearch','includeExternal','annotatedOnly']) {
  get(id).addEventListener('change', ()=>{
    if (id === 'stage') refreshBooks();
    render();
  });
}
for (const button of document.querySelectorAll('[data-query]')) {
  button.onclick = ()=>{
    get('query').value = button.dataset.query;
    get('searchScope').value = 'reverse';
    get('examCategory').value = '';
    render();
  };
}
get('clear').onclick = ()=>{
  get('query').value = '';
  for (const id of filterNames) get(id).value = '';
  get('examCategory').value = '';
  get('searchScope').value = 'reverse';
  get('fuzzySearch').checked = get('includeExternal').checked = true;
  get('annotatedOnly').checked = false;
  refreshBooks();
  render();
};
get('closeNote').onclick = ()=>get('noteDialog').close();
get('copy').onclick = async ()=>{
  if (!activeArticle) return;
  try {
    await navigator.clipboard.writeText(activeArticle.text);
    get('message').textContent = '已复制正文。';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(get('text'));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    get('message').textContent = '已选中正文，可使用系统复制。';
  }
};
get('download').onclick = ()=>{ if (activeArticle) saveText(activeArticle.title, fullText(activeArticle)); };
get('exportResults').onclick = exportResults;
const params = new URLSearchParams(location.search);
if (params.get('volume') in books) get('volume').value = params.get('volume');
get('query').value = params.get('q') || '';
render(params.get('document'));
