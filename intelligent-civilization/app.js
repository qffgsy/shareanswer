(function () {
  'use strict';
  var content = document.getElementById('content');
  var status = document.getElementById('status');
  var chapterSelect = document.getElementById('chapter');
  var typeSelect = document.getElementById('type');
  var search = document.getElementById('search');
  var empty = document.getElementById('empty');
  var sections = [], cards = [];
  function element(tag, text, className) {
    var result = document.createElement(tag);
    if (text !== undefined) result.textContent = text;
    if (className) result.className = className;
    return result;
  }
  function clearFilters() {
    search.value = '';
    chapterSelect.value = '';
    typeSelect.value = '';
    update();
  }
  function update() {
    var term = search.value.trim().toLocaleLowerCase();
    var filtered = !!(term || chapterSelect.value || typeSelect.value);
    var matches = 0;
    cards.forEach(function (entry) {
      var visible = (!chapterSelect.value || entry.chapter === chapterSelect.value) &&
        (!typeSelect.value || entry.type === typeSelect.value) &&
        (!term || entry.search.indexOf(term) !== -1);
      entry.node.hidden = !visible;
      if (visible) matches++;
    });
    sections.forEach(function (entry) {
      var isChapter = !chapterSelect.value || entry.chapter === chapterSelect.value;
      var sectionHasMatch = entry.cards.some(function (card) { return !card.hidden; });
      entry.node.hidden = !isChapter || (filtered && !sectionHasMatch);
    });
    document.querySelectorAll('.chapter').forEach(function (node) {
      node.hidden = (chapterSelect.value && node.dataset.chapter !== chapterSelect.value) ||
        (filtered && !Array.from(node.querySelectorAll('.section-block')).some(function (section) { return !section.hidden; }));
    });
    status.textContent = '显示 ' + matches + ' / ' + cards.length + ' 道题';
    empty.hidden = matches !== 0;
  }
  function showTarget() {
    if (!/^#question-/.test(location.hash)) return;
    var id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (error) { return; }
    var target = document.getElementById(id);
    if (!target) return;
    clearFilters();
    requestAnimationFrame(function () { target.scrollIntoView({block:'start'}); });
  }
  fetch('questions.json').then(function (response) {
    if (!response.ok) throw new Error('题库加载失败');
    return response.json();
  }).then(function (data) {
    data.chapters.forEach(function (chapter) {
      var chNo = String(chapter.number);
      var option = element('option', '第 ' + chapter.number + ' 章 · ' + chapter.title);
      option.value = chNo;
      chapterSelect.appendChild(option);
      var chapterNode = element('section', undefined, 'chapter');
      chapterNode.dataset.chapter = chNo;
      var chapterHeading = element('div', undefined, 'chapter-heading');
      chapterHeading.append(element('span', 'CHAPTER ' + String(chapter.number).padStart(2,'0')), element('h3', chapter.title));
      chapterNode.appendChild(chapterHeading);
      var focus = element('div', undefined, 'focus');
      focus.append(element('strong', '考向参考 · '), document.createTextNode(chapter.exam_focus || ''));
      chapterNode.appendChild(focus);
      chapter.sections.forEach(function (section) {
        var sectionNode = element('section', undefined, 'section-block');
        sectionNode.append(element('h4', section.id + ' ' + section.title), element('p', section.summary || '', 'section-summary'));
        var sectionCards = [];
        section.questions.forEach(function (question) {
          var card = element('article', undefined, 'card');
          card.id = 'question-' + section.id.replace(/\./g, '-') + '-' + question.number;
          card.append(element('div', section.id + ' · 第 ' + question.number + ' 题 · ' + question.type, 'tag'), element('p', question.stem, 'stem'));
          if (question.options && question.options.length) {
            var list = element('ul', undefined, 'options');
            question.options.forEach(function (opt) { list.appendChild(element('li', opt.label + '. ' + opt.text)); });
            card.appendChild(list);
          }
          var details = element('details');
          details.append(element('summary', '查看原记录与辨析'), element('p', '原记录：' + question.answer, 'answer'));
          if (question.note) details.appendChild(element('p', '辨析：' + question.note, 'note'));
          card.appendChild(details);
          sectionNode.appendChild(card);
          sectionCards.push(card);
          cards.push({node: card, chapter: chNo, type: question.type,
            search: [chapter.title, section.id, section.title, section.summary, question.stem, question.answer, question.note,
              (question.options || []).map(function (opt) { return opt.text; }).join(' ')].join(' ').toLocaleLowerCase()});
        });
        sections.push({node: sectionNode, chapter: chNo, cards: sectionCards});
        chapterNode.appendChild(sectionNode);
      });
      content.appendChild(chapterNode);
    });
    update();
    showTarget();
  }).catch(function () { status.textContent = '题库加载失败，请刷新页面后重试。'; });
  search.addEventListener('input', update);
  chapterSelect.addEventListener('change', update);
  typeSelect.addEventListener('change', update);
  document.getElementById('clear').addEventListener('click', clearFilters);
  window.addEventListener('hashchange', showTarget);
}());
