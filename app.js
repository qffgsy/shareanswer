(function () {
  'use strict';
  var labels = { fill: '填空题', choice: '选择题', short: '简答题', calculation: '计算题' };
  var field = document.getElementById('search-input');
  var results = document.getElementById('results');
  var empty = document.getElementById('empty-state');
  var error = document.getElementById('load-error');
  var status = document.getElementById('result-status');
  var frame = document.getElementById('catalog-source');
  var filters = Array.from(document.querySelectorAll('.filter'));
  var items = [];
  var activeType = 'all';
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
    ['all', 'fill', 'choice', 'short', 'calculation'].forEach(function (type) {
      document.querySelector('[data-count="' + type + '"]').textContent =
        type === 'all' ? items.length : items.filter(function (item) { return item.type === type; }).length;
    });
  }

  function render() {
    if (!loaded) return;
    var query = field.value.trim();
    var matching = items.filter(function (item) {
      return (activeType === 'all' || item.type === activeType) &&
        window.ShareAnswerCatalog.matches(item, query);
    });
    results.replaceChildren();
    empty.hidden = matching.length !== 0;
    status.textContent = '显示 ' + matching.length + ' / ' + items.length + ' 道题';
    matching.forEach(function (item) {
      var link = document.createElement('a');
      link.className = 'result-card';
      link.href = 'electrical/#' + encodeURIComponent(item.id);
      var meta = document.createElement('span');
      meta.className = 'result-meta';
      meta.textContent = labels[item.type] + '  /  ' + item.number;
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

  function showError() {
    if (loaded) return;
    status.textContent = '题目索引暂不可用';
    error.hidden = false;
  }

  function loadCatalog() {
    try {
      var doc = frame.contentDocument;
      if (!doc || !doc.querySelector('#fill .quiz-card')) { showError(); return; }
      items = window.ShareAnswerCatalog.extract(doc).filter(function (item) { return item.id && item.title; });
      if (!items.length) { showError(); return; }
      loaded = true; error.hidden = true; updateCounts(); render();
    } catch (exception) { showError(); }
  }

  field.addEventListener('input', render);
  document.getElementById('clear-search').addEventListener('click', function () {
    field.value = ''; field.focus(); render();
  });
  filters.forEach(function (button) {
    button.addEventListener('click', function () { setType(button.dataset.type); render(); });
  });
  document.querySelectorAll('[data-query]').forEach(function (button) {
    button.addEventListener('click', function () {
      field.value = button.dataset.query; setType('all'); render(); field.focus();
    });
  });
  frame.addEventListener('load', loadCatalog);
  try {
    if (frame.contentDocument && frame.contentDocument.querySelector('#fill .quiz-card')) loadCatalog();
  } catch (exception) { /* The load handler will show a fallback if needed. */ }
  window.setTimeout(showError, 12000);
}());
