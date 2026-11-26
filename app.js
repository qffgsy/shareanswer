(function () {
  'use strict';
  var labels = { fill: '填空题', choice: '选择题', short: '简答题', calculation: '计算题', judge: '判断题', term: '名词解释', essay: '论述题', coursework: '课程作业与学习任务' };
  var field = document.getElementById('search-input');
  var results = document.getElementById('results');
  var empty = document.getElementById('empty-state');
  var error = document.getElementById('load-error');
  var status = document.getElementById('result-status');
  var frame = document.getElementById('catalog-source');
  var filters = Array.from(document.querySelectorAll('.filter'));
  var sourceFilter = document.getElementById('source-filter');
  var waterItems = window.ShareAnswerCatalog.extractWater(window.WATER_QUIZ_DATA);
  var electricalItems = [];
  var lawItems = window.ShareAnswerCatalog.extractLaw();
  var courseItems = { civilization: [], airPollution: [] };
  var courseLoadFailed = false;
  var questionPaths = {
    electrical: 'electrical/',
    'environmental-law': 'environmental-law/',
    'intelligent-civilization': 'intelligent-civilization/',
    'air-pollution': 'air-pollution/'
  };
  var items = [];
  var activeType = 'all';
  var searchParams = new URLSearchParams(location.search);
  field.value = searchParams.get('q') || '';
  var initialSource = searchParams.get('source');
  if (Array.from(sourceFilter.options).some(function (option) { return option.value === initialSource; })) {
    sourceFilter.value = initialSource;
  }
  var loaded = false;

  function setType(type) {
    activeType = type;
    filters.forEach(function (button) {
      var active = button.dataset.type === type;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function updateCounts() {
    ['all', 'fill', 'choice', 'short', 'calculation', 'judge', 'term', 'essay', 'coursework'].forEach(function (type) {
      document.querySelector('[data-count="' + type + '"]').textContent =
        type === 'all' ? items.length : items.filter(function (item) { return item.type === type; }).length;
    });
  }

  function render() {
    if (!loaded) return;
    var query = field.value.trim();
    var matching = items.filter(function (item) {
      return (activeType === 'all' || item.type === activeType) &&
        (sourceFilter.value === 'all' || item.source === sourceFilter.value) &&
        window.ShareAnswerCatalog.matches(item, query);
    });
    results.replaceChildren();
    var paperMatches = [];
    if (query && activeType === 'all') {
      paperMatches = [
        {source: 'chemical', title: '化学法习题', href: 'water/?source=chemical'},
        {source: 'physical', title: '物理化学法习题', href: 'water/?source=physical'},
        {source: 'electrical', title: '电工与电子技术', href: 'electrical/'},
        {source: 'environmental-law', title: '环境法律法规复习', href: 'environmental-law/'},
        {source: 'intelligent-civilization', title: '智能文明题库', href: 'intelligent-civilization/'},
        {source: 'air-pollution', title: '大气污染控制工程习题', href: 'air-pollution/'}
      ].filter(function (paper) {
        return (sourceFilter.value === 'all' || sourceFilter.value === paper.source) &&
          paper.title.toLocaleLowerCase().indexOf(query.toLocaleLowerCase()) !== -1;
      });
    }
    empty.hidden = matching.length !== 0 || paperMatches.length !== 0;
    paperMatches.forEach(function (paper) {
      var link = document.createElement('a');
      link.className = 'result-card result-paper'; link.href = paper.href;
      var meta = document.createElement('span'); meta.className = 'result-meta'; meta.textContent = '整份试卷';
      var title = document.createElement('h3'); title.textContent = paper.title;
      var preview = document.createElement('p'); preview.textContent = '打开整份试卷 ↗';
      link.append(meta, title, preview); results.appendChild(link);
    });
    status.textContent = '显示 ' + matching.length + ' / ' + items.length + ' 条资料';
    matching.forEach(function (item) {
      var link = document.createElement('a');
      link.className = 'result-card';
      link.href = (questionPaths[item.source] || 'water/') + '#' + encodeURIComponent(item.id);
      var meta = document.createElement('span');
      meta.className = 'result-meta';
      meta.textContent = item.subject + '  /  ' + labels[item.type] + '  /  ' + item.number;
      var title = document.createElement('h3');
      title.textContent = item.title;
      var arrow = document.createElement('span');
      arrow.className = 'result-arrow'; arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '↗';
      link.append(meta, title);
      if (item.preview) {
        var preview = document.createElement('p');
        preview.textContent = item.preview;
        link.appendChild(preview);
      }
      link.appendChild(arrow);
      results.appendChild(link);
    });
  }

  function refreshCatalog() {
    items = waterItems.concat(electricalItems, lawItems, courseItems.civilization, courseItems.airPollution);
    loaded = !!items.length;
    updateCounts();
    render();
  }

  function showError() {
    if (!electricalItems.length || !waterItems.length || courseLoadFailed) {
      error.hidden = false;
      if (!items.length) status.textContent = '题目索引暂不可用';
    }
  }

  function loadCatalog() {
    try {
      var doc = frame.contentDocument;
      if (!doc || !doc.querySelector('#fill .quiz-card')) { showError(); return; }
      electricalItems = window.ShareAnswerCatalog.extract(doc).filter(function (item) { return item.id && item.title; });
      electricalItems.forEach(function (item) { item.source = 'electrical'; item.subject = '电工与电子技术'; });
      refreshCatalog();
      error.hidden = !!(electricalItems.length && waterItems.length && !courseLoadFailed);
    } catch (exception) { showError(); }
  }

  function loadCourseQuestions(course, url, extract) {
    fetch(url).then(function (response) {
      if (!response.ok) throw new Error('题库读取失败');
      return response.json();
    }).then(function (data) {
      var questions = extract(data);
      if (!questions.length) throw new Error('题库为空');
      courseItems[course] = questions;
      refreshCatalog();
    }).catch(function () {
      courseLoadFailed = true;
      showError();
    });
  }

  field.addEventListener('input', render);
  field.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') { event.preventDefault(); document.getElementById('library').scrollIntoView({ behavior: 'smooth' }); }
  });
  sourceFilter.addEventListener('change', render);
  document.getElementById('clear-search').addEventListener('click', function () {
    field.value = ''; field.focus(); render();
  });
  filters.forEach(function (button) {
    button.addEventListener('click', function () { setType(button.dataset.type); render(); });
  });
  document.querySelectorAll('[data-query]').forEach(function (button) {
    button.addEventListener('click', function () {
      field.value = button.dataset.query; sourceFilter.value = 'all'; setType('all'); render();
      document.getElementById('library').scrollIntoView({ behavior: 'smooth' });
    });
  });
  loadCourseQuestions('civilization', 'intelligent-civilization/questions.json?v=materials-20261126', window.ShareAnswerCatalog.extractCivilization);
  loadCourseQuestions('airPollution', 'air-pollution/questions.json', window.ShareAnswerCatalog.extractAirPollution);
  refreshCatalog();
  frame.addEventListener('load', loadCatalog);
  try {
    if (frame.contentDocument && frame.contentDocument.querySelector('#fill .quiz-card')) loadCatalog();
  } catch (exception) { /* The load handler will show a fallback if needed. */ }
  window.setTimeout(showError, 12000);
}());
