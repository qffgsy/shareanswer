(function () {
  'use strict';
  var labels = { fill: '填空题', choice: '选择题', short: '简答题', calculation: '计算题' };
  document.querySelectorAll('#short > h3').forEach(function (heading, index) {
    heading.id = 'short-' + (index + 1);
  });
  if (new URLSearchParams(location.search).has('index')) return;

  var hero = document.querySelector('header.hero');
  var back = document.createElement('a');
  back.className = 'sa-return'; back.href = '../'; back.textContent = '← 返回 ShareAnswer 习题库';
  hero.insertBefore(back, hero.firstChild);

  var search = document.createElement('section');
  search.className = 'sa-find'; search.setAttribute('aria-label', '搜索这套试卷');
  search.innerHTML = '<label for="sa-find-input">搜索这套试卷</label><input class="sa-find-input" id="sa-find-input" type="search" placeholder="输入题目、知识点或答案，例如：变压器、戴维宁" autocomplete="off"><p class="sa-find-status" aria-live="polite">可搜索题目和解析中的关键词。</p><ul class="sa-find-results"></ul>';
  var nav = document.querySelector('.layout > .nav');
  nav.insertAdjacentElement('afterend', search);
  var items = window.ShareAnswerCatalog.extract(document);
  var field = search.querySelector('input');
  var status = search.querySelector('.sa-find-status');
  var list = search.querySelector('.sa-find-results');
  function render() {
    var query = field.value.trim(); list.replaceChildren();
    if (!query) { status.textContent = '可搜索题目和解析中的关键词。'; return; }
    var matched = items.filter(function (item) { return window.ShareAnswerCatalog.matches(item, query); });
    status.textContent = matched.length ? '找到 ' + matched.length + ' 条相关题目，点击跳转。' : '没有找到相关题目，请换个关键词。';
    matched.forEach(function (item) {
      var li = document.createElement('li'), a = document.createElement('a'), small = document.createElement('small');
      a.href = '#' + encodeURIComponent(item.id); small.textContent = labels[item.type] + ' · ' + item.number;
      a.append(small, document.createTextNode(item.title)); li.appendChild(a); list.appendChild(li);
    });
  }
  field.addEventListener('input', render);
  var hash = decodeURIComponent(location.hash.slice(1));
  if (hash && document.getElementById(hash)) requestAnimationFrame(function () { document.getElementById(hash).scrollIntoView(); });
}());
