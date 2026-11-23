(function (global) {
  'use strict';
  const norm = s => String(s || '').normalize('NFKC').replace(/[\p{P}\p{Z}\s]/gu, '').toLowerCase();
  const unique = a => [...new Set(a)];
  const CATEGORY_ALIASES = [
    ['词语释义', ['词语释义', '实词释义', '解释字词', '词义解释']],
    ['一词多义', ['一词多义', '一字多义', '一字多意', '一词多意', '多个意思', '多种意思']],
    ['古今异义', ['古今异义', '古今异意', '古今意思不同', '古今意思不一样', '以前和现在意思不同']],
    ['读音字形', ['读音字形', '读音', '多音字', '怎么读', '字形', '读法']],
    ['通用字与通假', ['通假字', '通用字', '通借字', '通用字与通假']],
    ['词类活用', ['词类活用', '词性活用']],
    ['虚词功能', ['虚词功能', '虚词用法']],
    ['语气', ['语气']], ['逻辑关系', ['逻辑关系']],
    ['特殊句式', ['特殊句式', '特殊句型']],
    ['固定结构', ['固定结构', '固定搭配', '固定句式']],
    ['指代与省略', ['指代与省略', '指的谁', '指什么人', '指代对象']],
    ['文句理解与翻译', ['重点句翻译', '句子翻译', '文句翻译', '翻译考点']],
    ['文化常识', ['文化常识', '文学常识中的官职', '官职', '官名', '称谓', '年号', '纪年', '礼制', '敬称', '谦称']],
    ['文学与出处', ['文学与出处', '文学常识', '作者是谁', '作品出处']],
    ['背诵默写', ['背诵', '默写', '必背']],
    ['篇章理解与表达', ['篇章理解', '表达手法', '表达效果', '人物形象', '文章主旨']]
  ];
  const REPHRASE = [
    ['宾语提前', '宾语前置'], ['宾语放前面', '宾语前置'], ['宾语提到前面', '宾语前置'],
    ['名词当状语', '名词作状语'], ['名词做状语', '名词作状语'], ['名词作壮语', '名词作状语'],
    ['取消句子独立', '取消句子独立'], ['被动结构', '被动句'], ['表猜想', '表推测'],
    ['猜想的语气', '推测语气'], ['猜测的语气', '推测语气'], ['不大确定', '不太确定'],
    ['表承上启下', '表承接'], ['表转摺', '表转折'], ['古今异意', '古今异义'],
    ['一词多意', '一词多义'], ['一字多意', '一词多义']
  ];
  const GLOSSES = [
    ['眼泪', '泪水', '流下的泪'], ['跑', '奔跑', '快跑'], ['借助', '凭借', '依靠', '借用'],
    ['上报', '报告上级', '报告给上级'], ['可惜', '值得惋惜', '惋惜'], ['渐渐', '逐渐'],
    ['妻子儿女', '妻子和儿女', '妻子和孩子', '老婆孩子'], ['平民', '老百姓', '普通百姓', '没有官职的人'],
    ['到', '往', '前往', '到达'], ['离开', '离去', '离开某地'], ['全', '全部', '都'],
    ['只', '只是', '仅仅'], ['眼泪', '泪'], ['回头看', '回头', '回望'],
    ['害怕', '恐惧', '畏惧'], ['喜欢', '喜爱', '爱好'], ['认为', '以为', '觉得'],
    ['大约', '约数', '约莫'], ['但是', '然而', '却'], ['于是', '就'],
    ['成全', '成就'], ['帮助', '辅助'], ['美丽', '美好'], ['痛心遗憾', '痛心和遗憾'],
    ['与外界隔绝的地方', '与世隔绝的地方', '隔绝外界的地方'], ['交错相通', '互相通达', '道路相通'],
    ['成人自立', '长大成人并自立'], ['诉讼事件', '诉讼案件', '案件', '官司']
  ];
  const TAG_CATEGORIES = {
    '使动用法': '词类活用', '意动用法': '词类活用', '名词作状语': '词类活用',
    '宾语前置': '特殊句式', '被动句': '特殊句式', '判断句': '特殊句式', '省略句': '特殊句式',
    '定语后置': '特殊句式', '状语后置': '特殊句式', '结构助词': '虚词功能',
    '取消句子独立性': '虚词功能', '宾语前置标志': '虚词功能', '被动标志': '虚词功能',
    '指代': '指代与省略', '通假字': '通用字与通假', '通用字候选': '通用字与通假'
  };
  function categoryOf(tag) { return TAG_CATEGORIES[tag] || (tag.endsWith('语气') ? '语气' : tag.endsWith('关系') ? '逻辑关系' : ''); }
  function grams(s) { return new Set(Array.from({length: Math.max(0, s.length - 1)}, (_, i) => s.slice(i, i + 2))); }
  function fuzzyScore(query, text) {
    if (query.length < 4 || !text) return 0;
    if (text.includes(query)) return 1;
    const gs = grams(query); let count = 0;
    for (const g of gs) if (text.includes(g)) count++;
    const ratio = count / gs.size;
    // Short fragments need strong overlap; a single common character never suffices.
    return count >= 2 && ratio >= (query.length < 6 ? .72 : .6) ? ratio : 0;
  }
  function family(s) { const n = norm(s); return unique([n, ...GLOSSES.filter(f => f.some(x => norm(x) === n)).flat().map(norm)]); }
  function glossIncludes(meaning, variant) {
    const plain=String(meaning||'').replace(/^〔[^〕]*〕\s*/, '');
    if(variant.length>1)return norm(plain).includes(variant);
    // Single-character glosses such as 就/都/全 must be independent explanation units.
    return plain.split(/[，。；、：“”‘’()（）\s]/).some(t=>t.replace(/^(?:这里|此处)?(?:是|指|译为|意为|表示)/,'')===variant);
  }
  function create({articles, entries, parseBase}) {
    const articleMap = new Map(articles.map(a => [a.id, a]));
    const prepared = entries.map(x => ({...x, tags: x.tags || [], categories: unique([...(x.categories || []), ...(x.tags || []).map(categoryOf).filter(Boolean)]), _word: norm(x.term), _meaning: norm(x.meaning), _example: norm(x.example)}));
    const sentences = new Map(articles.map(a => [a.id, (a.text.match(/[^。！？\n]+(?:[。！？][”’」』]*)?/g) || []).filter(s => /\p{Script=Han}/u.test(s)).map(s => ({text: s, normal: norm(s)}))]));
    function parse(raw) {
      let canonical = raw.trim();
      for (const [from, to] of REPHRASE) canonical = canonical.replaceAll(from, to);
      const p = parseBase(canonical); p.raw = raw.trim(); p.categories = []; p.query_rephrased = canonical !== raw.trim();
      let body = canonical.replace(/《[^》]*》/g, '');
      for (const t of p.titles) body = body.replaceAll(t, '');
      body = body.replace(/(?:不是|不要|不含|排除)([^，。]*?)(?=而是|只要|，|。|$)/g, '');
      for (const [cat, aliases] of CATEGORY_ALIASES) if (aliases.some(a => a==='断句' ? /(?<!判)断句/.test(body) : body.includes(a))) p.categories.push(cat);
      // A specific grammar tag is more precise than its umbrella category.
      p.categories = p.categories.filter(c => !p.tags.some(t => categoryOf(t) === c));
      const TOPICS=[['官职',/官职|官名/,/官职|官名|官员|官吏|官署|太守|刺史|太傅|丞相|尚书|侍郎|侍从官|太子洗马|司马|县令/],['年号',/年号/,/年号/],['称谓',/称谓|敬称|谦称/,/称谓|敬称|谦称|尊称|称呼|称自己的|称对方/]];
      const topic=TOPICS.find(([,trigger])=>trigger.test(body));p.topic=topic?{name:topic[0],pattern:topic[2].source}:null;
      if (/何\s*(?:…|\.)*\s*之有/.test(body)) { p.pattern = ['何', '之有']; p.tags = unique([...p.tags, '宾语前置']); p.fragment = ''; p.intent='句式特征 → 例句'; }
      if (/为\s*(?:…|\.)*\s*所/.test(body)) { p.pattern = ['为', '所']; p.tags = unique([...p.tags, '被动句']); p.fragment = ''; p.intent='句式特征 → 例句'; }
      if(!p.term){const targeted=body.match(/^([之其而以于焉乃则者所也乎矣且若为盖殆遂])(?:字)?的(?:推测|反问|感叹|转折|承接|因果|用法|意义|意思)/);if(targeted){p.term=targeted[1];p.fragment=''}}
      if (p.categories.length) {
        p.fragment = '';
        const word = body.match(/(?:[“‘「'"]([^”’」'"]{1,4})[”’」'"]|([\p{Script=Han}]{1,4})的)(?:古今异义|古今异意|一词多义|用法|读音|含义)/u);
        if (word && (word[1] || word[2]) && !/这个|词语|字词|常见|所有|课文|表示/.test(word[1] || word[2])) p.term = word[1] || word[2];
        p.intent = '考查角度 → 项目索引';
        if(!p.term){let rest=body;for(const [c,aliases] of CATEGORY_ALIASES)if(p.categories.includes(c))for(const alias of aliases)rest=rest.replaceAll(alias,'');rest=rest.replace(/^(?:请|帮我)?(?:找|查|查询|搜索)/,'').replace(/(?:的|有哪些|有什么|例子|例句|用法|考点|常见|所有|相关|中)/g,'').replace(/[\p{P}\p{Z}\s]/gu,'');if(/^[\p{Script=Han}]{1,4}$/u.test(rest)&&!['词语','字词','文言','文言文','古文'].includes(rest))p.term=rest}
      }
      if(p.titles.length&&/^(?:中|的)?(?:全部|所有|常见)?(?:考点|易考点|考查点)$/.test(body.trim())){p.fragment='';p.intent='指定课文 → 已整理考点'}
      // These questions concern quantity, not speculative modality.
      if (/约数|大约多少|大概多少|大致数量/.test(body)) { p.tags = []; p.categories = []; p.glosses = ['大约']; p.fragment = ''; p.intent = '现代意义 → 文言字词'; }
      p.explicit_recitation = /必背/.test(body);
      p.pos = p.pos || '';
      p.fragment = (p.fragment || '').replace(/^(?:请|帮我|帮忙)?(?:搜索|搜一下|搜|查找|查一下|查询|找一下|找)(?:一下)?/, '').replace(/(?:是什么意思|是什么含义|的意思|的释义|什么意思|怎么解释)[？?]?$/, '').trim();
      if (!p.tags.length && !p.categories.length && !p.glosses.length && !p.pattern.length && !p.pos && !p.term && p.fragment && p.intent!=='记忆碎片 → 原文') {
        if (family(p.fragment).length > 1) { p.glosses = [p.fragment]; p.fragment = ''; p.intent = '现代意义 → 文言字词'; }
      }
      const requests = /^(?:帮我找一下|帮我找|帮我查一下|帮我查|请搜索|搜索|查找|查询|这个是什么意思|什么意思|解释一下|考点|易考点|所有考点)?[？?。！!]*$/;
      p.empty_request = !!p.raw && !p.titles.length && (requests.test(p.raw) || (!p.fragment && !p.tags.length && !p.categories.length && !p.glosses.length && !p.pattern.length && !p.pos && !p.term && !p.object));
      return p;
    }
    function filters(x, p, allowCandidates) {
      if (!allowCandidates && x.candidate) return false;
      if (!allowCandidates && p.categories.includes('一词多义') && x.polysemy_only_candidate) return false;
      if(p.topic&&!new RegExp(p.topic.pattern).test(x.term+' '+x.meaning))return false;
      if (p.explicit_recitation && x.kind === 'recitation' && !x.explicit_requirement) return false;
      if (p.categories.some(c => !x.categories.includes(c))) return false;
      if (p.tags.some(t => !x.tags.includes(t) && !(t === '通假字' && x.tags.includes('通用字候选')))) return false;
      if (p.pos && x.pos !== p.pos && !(x.pos || '').includes('为' + p.pos)) return false;
      if (p.object === '虚词' && !['副词', '代词', '介词', '连词', '助词', '叹词'].includes(x.pos)) return false;
      if (p.term && x._word !== norm(p.term) && !x._word.includes(norm(p.term))) return false;
      if (p.term && /^[之其而以于焉乃则者所也乎矣且若为盖殆遂]$/.test(p.term) && x.term !== p.term) return false;
      if (p.pattern.length) { let offset = 0; for (const part of p.pattern) { const i = x.example.indexOf(part, offset); if (i < 0) return false; offset = i + part.length; } }
      return true;
    }
    function score(x, p, fuzzy) {
      if (p.glosses.length) {
        if(x.kind==='article_metadata'||x.kind==='recitation'||x.source_ref?.target==='title')return null;
        for (const g of p.glosses) {
          const variants = family(g);
          if (variants.some(v => glossIncludes(x.meaning,v))) return {score: 110+(x._word.length<=2?15:0)+(x._meaning.length<=18?8:0), reason: glossIncludes(x.meaning,norm(g)) ? '释义匹配' : '近义表达匹配'};
          if (fuzzy && norm(g).length >= 4 && fuzzyScore(norm(g), x._meaning) >= .72) return {score: 48, reason: '近似释义候选，请核对', fuzzy: true};
        }
        return null;
      }
      const q = norm(p.fragment);
      if (!q) return {score: 100, reason: p.categories.length ? '考查角度匹配' : '知识标签匹配'};
      if (x._word === q) return {score: 160, reason: '字词精确匹配'};
      if (x.kind === 'article_metadata') return null;
      if (q.length === 1) return x._word.includes(q) ? {score: 125, reason: '词条包含此字'} : null;
      if (x._word.includes(q)) return {score: 135, reason: '词条片段匹配'};
      if (x._example.includes(q)) return {score: 125, reason: '例句片段匹配'};
      if (x._meaning.includes(q)) return {score: 110, reason: '释义文字匹配'};
      return null;
    }
    function search(raw, options = {}) {
      const p = parse(raw), byArticle = new Map(), external = [];
      const allowed = articles.filter(a => (!options.ids || options.ids.has(a.id)) && !p.unknownTitle && (!p.titles.length || p.titles.includes(a.title)));
      const ids = new Set(allowed.map(a => a.id));
      if (!p.raw) return {parsed: p, rows: allowed, byArticle: new Map(allowed.map(a => [a.id, []])), external};
      if (p.empty_request || p.unknownTitle) return {parsed: p, rows: [], byArticle, external};
      function add(x, m) {
        const hit = {...x, match_reason: m.reason, approximate: !!m.fuzzy, priority: m.score + (x.priority || 0) / 15 - (x.candidate ? 35 : 0)};
        delete hit._word; delete hit._meaning; delete hit._example;
        if (x.external) { external.push(hit); return; }
        if (!byArticle.has(x.article_id)) byArticle.set(x.article_id, []);
        byArticle.get(x.article_id).push(hit);
      }
      for (const x of prepared) {
        if (x.external ? !options.external || p.titles.length : !ids.has(x.article_id)) continue;
        if (!filters(x, p, options.candidates !== false)) continue;
        const match = score(x, p, options.fuzzy !== false); if (match) add(x, match);
      }
      const semantic = p.categories.length || p.tags.length || p.glosses.length || p.term || p.pos || p.object || p.pattern.length;
      if (!semantic && p.fragment) {
        const q = norm(p.fragment);
        for (const a of allowed) {
          const exact = norm(a.text).includes(q); const list = sentences.get(a.id) || [];
          let hits = exact ? list.filter(s => s.normal.includes(q)).slice(0, 4).map(s => ({...s, score: 1})) : [];
          // Exact fragments spanning sentence boundaries retain the original surrounding text.
          if (exact && !hits.length) hits = [{text: a.text, score: 1}];
          if (!exact && options.fuzzy !== false && q.length >= 4) hits = list.map(s => ({...s, score: fuzzyScore(q, s.normal)})).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 2);
          for (let i = 0; i < hits.length; i++) {
            const s = hits[i];
            if (exact && (byArticle.get(a.id) || []).some(x => norm(x.example).includes(q))) continue;
            add({id: 'fragment:' + a.id + ':' + i, article_id: a.id, title: a.title, term: exact ? p.fragment : '', pos: '', tags: [], categories: [], meaning: '', example: s.text, explanation: exact ? '原文包含此片段，忽略标点和空白。' : '记忆片段近似匹配，请核对原文；不据此判定义项或语法。', evidence: [], basis: exact ? '作品原文片段' : '近似原文候选', priority: 0, external: false}, {score: exact ? 120 : 45 + Math.round(s.score * 15), reason: exact ? '正文片段匹配' : '近似记忆片段', fuzzy: !exact});
          }
        }
      }
      for (const [id, list] of byArticle) {
        list.sort((a, b) => b.priority - a.priority);
        const seen = new Set(); const coveredNotes = new Set(list.filter(x => x.kind === 'analysis').flatMap(x => x.evidence));
        byArticle.set(id, list.filter(x => { if (x.kind === 'note' && x.evidence.some(e => coveredNotes.has(e))) return false; const key = x.id; if (seen.has(key)) return false; seen.add(key); return true; }));
      }
      if (!semantic && !p.fragment && p.titles.length) for (const a of allowed) if (!byArticle.has(a.id)) byArticle.set(a.id, []);
      return {parsed: p, rows: allowed.filter(a => byArticle.has(a.id)), byArticle, external: external.sort((a,b) => b.priority - a.priority)};
    }
    return {parse, search, entries: prepared};
  }
  global.ExamSearch = {create, norm, fuzzyScore};
})(typeof window !== 'undefined' ? window : globalThis);