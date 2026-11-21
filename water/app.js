(function () {
  'use strict';
  const items = Array.isArray(window.WATER_QUIZ_DATA) ? window.WATER_QUIZ_DATA : [];
  const STORAGE = 'shareanswer-water-quiz-v1';
  const sourceNames = { chemical: '化学法', physical: '物理化学法' };
  const $ = id => document.getElementById(id);
  const root = $('questions');
  let storageWorks = true;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE) || '{}') || {}; }
  catch (_) { storageWorks = false; document.body.classList.add('no-storage'); document.querySelector('.private-note').textContent = '当前浏览器无法保存进度'; }
  let source = new URLSearchParams(location.search).get('source');
  if (!sourceNames[source]) source = 'all';
  let section = 'all';
  let query = '';
  const sectionNames = [...new Set(items.map(q => q.section))];
  sectionNames.forEach(name => { const option = document.createElement('option'); option.value = name; option.textContent = name; $('section-filter').appendChild(option); });

  function state(q) {
    if (!saved[q.id] || typeof saved[q.id] !== 'object') saved[q.id] = {};
    return saved[q.id];
  }
  function persist() {
    if (!storageWorks) return;
    try { localStorage.setItem(STORAGE, JSON.stringify(saved)); }
    catch (_) { storageWorks = false; document.body.classList.add('no-storage'); document.querySelector('.private-note').textContent = '当前浏览器无法保存进度'; }
  }
  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }
  function updateFilters() {
    document.querySelectorAll('[data-source]').forEach(button => {
      const on = button.dataset.source === source;
      button.classList.toggle('active', on); button.setAttribute('aria-pressed', String(on));
    });
    $('section-filter').value = section;
  }
  function updateProgress() {
    const completed = items.filter(q => state(q).viewed).length;
    const graded = items.filter(q => (q.grading === 'single' || q.grading === 'judgment') && state(q).selected);
    const correct = graded.filter(q => state(q).selected === q.correct).length;
    $('completed-count').textContent = completed;
    $('total-count').textContent = ' / ' + items.length;
    $('progress-fill').style.width = (items.length ? completed / items.length * 100 : 0) + '%';
    $('score-summary').textContent = graded.length ? `自动判题：已作答 ${graded.length} 题，当前答对 ${correct} 题` : '完成选择或判断题后，这里会记录作答情况。';
  }
  function answerBody(text) {
    const container = node('div', 'answer');
    const parts = String(text || '').split(/(https?:\/\/[^\s）)；;，。]+)/g);
    parts.forEach(part => {
      if (/^https?:\/\//.test(part)) {
        const a = node('a', '', part); a.href = part; a.target = '_blank'; a.rel = 'noopener noreferrer'; container.appendChild(a);
      } else container.appendChild(document.createTextNode(part));
    });
    return container;
  }
  function renderCard(q) {
    const s = state(q), card = node('article', 'question');
    card.id = q.id;
    const meta = node('div', 'question-meta');
    meta.append(node('span', 'index-mark', sourceNames[q.source] || q.source), node('span', 'tag', q.section), node('span', '', '第 ' + q.number + ' 题'));
    if (q.grading === 'review') meta.append(node('span', 'tag review', '参考题 · 不计分'));
    card.append(meta, node('h3', '', q.prompt));
    if (q.options && q.options.length) {
      const options = node('div', 'options'); options.setAttribute('role', 'group'); options.setAttribute('aria-label', '选择答案');
      q.options.forEach(opt => {
        const btn = node('button', 'option'); btn.type = 'button';
        const selected = s.selected === opt.key;
        if (selected) btn.classList.add('selected');
        if (selected && q.grading !== 'review' && opt.key !== q.correct) btn.classList.add('wrong');
        btn.setAttribute('aria-pressed', String(selected));
        btn.append(node('span', 'key', opt.key), node('span', '', opt.text === opt.key ? (opt.key === '对' ? '判断为正确' : '判断为错误') : opt.text));
        btn.addEventListener('click', () => { s.selected = opt.key; s.viewed = true; if (q.grading !== 'review') s.revealed = true; persist(); renderCardInPlace(q); updateProgress(); });
        options.appendChild(btn);
      });
      card.appendChild(options);
      if (s.selected) {
        let msg = '已选择 ' + s.selected + '。请查看参考解析，自行比较。', style = '';
        if (q.grading !== 'review') {
          const right = s.selected === q.correct;
          msg = right ? '回答正确，查看下方解析。' : '这次选择不正确，可结合下方解析再试。';
          style = right ? ' good' : ' bad';
        }
        const feedback = node('p', 'feedback' + style, msg); feedback.setAttribute('role', 'status'); card.appendChild(feedback);
      }
    }
    const toggle = node('button', 'answer-toggle', s.revealed ? '收起解析 ↑' : '查看答案与解析 ↓');
    toggle.type = 'button'; toggle.setAttribute('aria-expanded', String(!!s.revealed));
    toggle.addEventListener('click', () => { s.revealed = !s.revealed; if (s.revealed) s.viewed = true; persist(); renderCardInPlace(q); updateProgress(); });
    card.appendChild(toggle);
    if (s.revealed) {
      card.appendChild(answerBody(q.answer));
      if (q.courseSource) card.appendChild(node('p', 'course-reference', '课件参考：' + q.courseSource));
      if (q.note) card.appendChild(answerBody(q.note));
      if (q.grading === 'self' || q.grading === 'review') {
        const group = node('div', 'self-controls'); group.appendChild(node('span', '', '自评：'));
        [['understood', '已掌握'], ['review', '再复习']].forEach(([value, text]) => {
          const btn = node('button', s.self === value ? 'selected' : '', text); btn.type = 'button'; btn.setAttribute('aria-pressed', String(s.self === value));
          btn.addEventListener('click', () => { s.self = value; s.viewed = true; persist(); renderCardInPlace(q); updateProgress(); }); group.appendChild(btn);
        });
        card.appendChild(group);
      }
    }
    return card;
  }
  function renderCardInPlace(q) {
    const old = document.getElementById(q.id); if (old) old.replaceWith(renderCard(q));
  }
  function render() {
    updateFilters(); updateProgress();
    const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    const visible = items.filter(q => {
      if (source !== 'all' && q.source !== source) return false;
      if (section !== 'all' && q.section !== section) return false;
      const text = [q.prompt, q.answer, q.courseSource, q.section, sourceNames[q.source], ...q.options.map(o => o.key + ' ' + o.text)].join(' ').toLocaleLowerCase();
      return terms.every(term => text.includes(term));
    });
    const fragment = document.createDocumentFragment(); visible.forEach(q => fragment.appendChild(renderCard(q)));
    root.replaceChildren(fragment); $('empty').hidden = !!visible.length;
    $('result-count').textContent = `显示 ${visible.length} 道题，共 ${items.length} 道`;
  }
  function goToHash() {
    let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
    if (!items.some(q => q.id === id)) return;
    source = 'all'; section = 'all'; query = ''; $('search').value = '';
    const targetQuestion = items.find(q => q.id === id);
    state(targetQuestion).revealed = true;
    render();
    requestAnimationFrame(() => { const target = document.getElementById(id); if (target) target.scrollIntoView({block:'start'}); });
  }
  document.querySelectorAll('[data-source]').forEach(button => button.addEventListener('click', () => { source = button.dataset.source; render(); }));
  $('section-filter').addEventListener('change', event => { section = event.target.value; render(); });
  $('search').addEventListener('input', event => { query = event.target.value; render(); });
  $('clear-search').addEventListener('click', () => { query = ''; $('search').value = ''; render(); $('search').focus(); });
  $('clear-filters').addEventListener('click', () => { query = ''; source = 'all'; section = 'all'; $('search').value = ''; render(); });
  $('expand-all').addEventListener('click', () => { document.querySelectorAll('.question').forEach(card => { state(items.find(q => q.id === card.id)).revealed = true; }); persist(); render(); });
  $('collapse-all').addEventListener('click', () => { document.querySelectorAll('.question').forEach(card => { state(items.find(q => q.id === card.id)).revealed = false; }); persist(); render(); });
  $('reset').addEventListener('click', () => { if (!window.confirm('确定清除这台设备上保存的作答、自评和进度吗？')) return; saved = {}; persist(); render(); });
  window.addEventListener('hashchange', goToHash);
  if (!items.length) { $('result-count').textContent = '题目加载失败，请刷新页面重试。'; return; }
  render(); goToHash();
}());

