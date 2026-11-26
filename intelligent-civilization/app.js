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
    var type = typeSelect.value;
    var filtered = !!(term || chapterSelect.value || type);
    var matches = 0;
    cards.forEach(function (entry) {
      var matchesType = !type || (type === 'objective' ? entry.type !== '简答题' : entry.type === type);
      var visible = (!chapterSelect.value || entry.chapter === chapterSelect.value) && matchesType &&
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
  function addExercise(card, question) {
    var isMultiple = question.type === '多选题';
    var isJudge = question.type === '判断题';
    var options = isJudge ? [{label: '对', text: '对'}, {label: '错', text: '错'}] : (question.options || []);
    var raw = String(question.answer || '').trim().toUpperCase();
    var answer = isJudge ? (raw === '对' || raw === '错' ? [raw] : []) :
      (/^[A-Z]+$/.test(raw) ? raw.split('') : []);
    var valid = !question.answerConflict && answer.length > 0 && new Set(answer).size === answer.length &&
      answer.every(function (value) { return options.some(function (opt) { return opt.label === value; }); }) &&
      (isMultiple ? answer.length > 1 : answer.length === 1);
    var group = element('fieldset', undefined, 'exercise');
    group.setAttribute('aria-labelledby', card.id + '-stem');
    group.appendChild(element('legend', isMultiple ? '请选择所有正确选项' : '请选择一个选项'));
    var choices = element('div', undefined, 'choices');
    options.forEach(function (opt) {
      var label = element('label', undefined, 'choice');
      var input = document.createElement('input');
      input.type = isMultiple ? 'checkbox' : 'radio';
      input.name = card.id;
      input.value = opt.label;
      var caption = isJudge ? opt.text : opt.label + '. ' + opt.text;
      label.append(input, element('span', caption));
      choices.appendChild(label);
    });
    group.appendChild(choices);
    var actions = element('div', undefined, 'exercise-actions');
    var submit;
    if (isMultiple) {
      submit = element('button', '提交答案', 'submit-answer');
      submit.type = 'button';
      actions.appendChild(submit);
    }
    var reset = element('button', '重做本题', 'reset-answer');
    reset.type = 'button';
    reset.hidden = true;
    actions.appendChild(reset);
    group.appendChild(actions);
    var feedback = element('div', undefined, 'feedback');
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    feedback.hidden = true;
    group.appendChild(feedback);
    function clearFeedback() {
      feedback.hidden = true;
      feedback.replaceChildren();
      feedback.className = 'feedback';
      reset.hidden = true;
    }
    function assess() {
      var selected = Array.from(group.querySelectorAll('input:checked')).map(function (input) { return input.value; });
      feedback.hidden = false;
      feedback.replaceChildren();
      feedback.className = 'feedback';
      if (!selected.length) {
        feedback.appendChild(element('strong', '请先选择答案。'));
        return;
      }
      reset.hidden = false;
      if (!valid) {
        feedback.classList.add('review');
        var message = question.answerConflict ? '两份资料的答案有出入，请核对原记录。' :
          question.answer ? '原记录无法自动判定，请结合课程资料核对。' : '资料未附答案，本题暂不判分。';
        feedback.appendChild(element('strong', message));
      } else {
        var correct = selected.length === answer.length && selected.every(function (value) { return answer.indexOf(value) !== -1; });
        feedback.classList.add(correct ? 'correct' : 'incorrect');
        feedback.appendChild(element('strong', correct ? '与资料答案一致' : '与资料答案不一致'));
      }
      addAnswerText(feedback, question);
    }
    choices.addEventListener('change', function () {
      if (isMultiple) clearFeedback();
      else assess();
    });
    if (submit) submit.addEventListener('click', assess);
    reset.addEventListener('click', function () {
      group.querySelectorAll('input').forEach(function (input) { input.checked = false; });
      clearFeedback();
    });
    card.appendChild(group);
  }
  function addAnswerText(container, question) {
    if (question.answer) {
      var title = question.type === '简答题' ? '参考作答' : (question.source ? '补充资料答案' : '历史原记录');
      container.append(element('p', title, 'answer-label'), element('div', question.answer, 'answer-text'));
    } else if (question.type === '简答题' || container.tagName === 'DETAILS') {
      container.appendChild(element('p', '资料未附参考答案。'));
    }
    if (question.answerConflict) {
      container.append(element('p', '历史原记录', 'answer-label'), element('div', question.answerConflict, 'answer-text'));
    }
    if (question.note) container.appendChild(element('p', question.note, 'note feedback-note'));
  }
  var initialType = new URLSearchParams(location.search).get('type');
  if (initialType === 'short') typeSelect.value = '简答题';
  if (initialType === 'objective') typeSelect.value = 'objective';

  fetch('questions.json?v=materials-20261126').then(function (response) {
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
          var stem = element('p', question.stem, 'stem');
          stem.id = card.id + '-stem';
          card.append(element('div', section.id + ' · 第 ' + question.number + ' 题 · ' + question.type, 'tag'), stem);
          if (question.type !== '简答题') addExercise(card, question);
          var details = element('details');
          details.appendChild(element('summary', question.type === '简答题' ? '查看参考作答' : '查看答案与辨析'));
          addAnswerText(details, question);
          if (question.source) details.appendChild(element('p', '来源：《' + question.source + '》', 'question-source'));
          card.appendChild(details);
          sectionNode.appendChild(card);
          sectionCards.push(card);
          cards.push({node: card, chapter: chNo, type: question.type,
            search: [chapter.title, section.id, section.title, section.summary, question.type, question.stem, question.answer,
              question.answerConflict, question.note,
              (question.options || []).map(function (opt) { return opt.text; }).join(' ')].join(' ').toLocaleLowerCase()});
        });
        sections.push({node: sectionNode, chapter: chNo, cards: sectionCards});
        chapterNode.appendChild(sectionNode);
      });
      content.appendChild(chapterNode);
    });
    var objectiveCount = cards.filter(function (entry) { return entry.type !== '简答题'; }).length;
    document.getElementById('objective-count').textContent = objectiveCount;
    document.getElementById('short-count').textContent = cards.length - objectiveCount;
    update();
    showTarget();
  }).catch(function () { status.textContent = '题库加载失败，请刷新页面后重试。'; });
  search.addEventListener('input', update);
  chapterSelect.addEventListener('change', update);
  typeSelect.addEventListener('change', update);
  document.getElementById('clear').addEventListener('click', clearFilters);
  window.addEventListener('hashchange', showTarget);
}());
