(function () {
  'use strict';
  const questions = Array.from(document.querySelectorAll('.question'));
  const search = document.getElementById('search');
  const filters = Array.from(document.querySelectorAll('.filter'));
  const result = document.getElementById('result');
  const noResults = document.getElementById('no-results');
  let category = 'all';

  function applyFilters() {
    const term = search.value.trim().toLocaleLowerCase();
    let count = 0;
    questions.forEach(function (item) {
      const matches = (category === 'all' || item.dataset.category === category) && item.textContent.toLocaleLowerCase().includes(term);
      item.hidden = !matches;
      if (matches) count++;
    });
    result.textContent = '显示 ' + count + ' / 7 道平时作业';
    noResults.hidden = count !== 0;
  }
  search.addEventListener('input', applyFilters);
  document.getElementById('clear').addEventListener('click', function () { search.value = ''; applyFilters(); search.focus(); });
  filters.forEach(function (button) { button.addEventListener('click', function () {
    category = button.dataset.filter;
    filters.forEach(function (other) { const active = other === button; other.classList.toggle('active', active); other.setAttribute('aria-pressed', String(active)); });
    applyFilters();
  }); });

  const chapters = [
    {number:'第一章', range:'第 1—15 条', title:'基本规定', core:'生态环境的概念、立法目的、基本原则与各方责任。', points:'第 2 条界定生态环境；第 6 条确立预防为主、系统治理、生态优先、绿色发展、公众参与、损害担责原则。'},
    {number:'第二章', range:'第 16—55 条', title:'监督管理', core:'政府组织协调、主管部门统一监督和生态环境监管机制。', points:'第 16—17 条涉及政府组织协调与生态环境主管部门统一监督；第 54 条涉及信用监管。'},
    {number:'第三章', range:'第 56—67 条', title:'规划和生态环境分区管控', core:'生态环境保护规划、分区管控和生态环境准入。', points:'第 66—67 条规定生态环境分区管控，划定优先保护、重点管控和一般管控单元，并制定生态环境准入清单。'},
    {number:'第四章', range:'第 68—81 条', title:'标准和监测', core:'国家与地方生态环境标准、监测网络和数据质量。', points:'第 69 条涉及国家和地方生态环境质量标准；第 80 条禁止篡改、伪造监测数据。'},
    {number:'第五章', range:'第 82—110 条', title:'生态环境影响评价', core:'规划和建设项目的生态环境影响评价及其实施。', points:'第 82—83 条涉及生态环境影响评价的定义与依法实施；未依法进行评价的建设项目不得开工。'},
    {number:'第六章', range:'第 111—116 条', title:'生态保护补偿', core:'纵向、横向以及市场机制相结合的生态保护补偿。', points:'第 111 条明确建立生态保护补偿制度；第 115 条鼓励通过市场机制开展补偿。'},
    {number:'第七章', range:'第 117—126 条', title:'突发生态环境事件应对', core:'突发事件预防准备、监测预警、应急处置、调查评估与恢复。', points:'第 117 条明确应对工作的主要环节；第 126 条涉及事后评估及结果公布。'},
    {number:'第八章', range:'第 127—136 条', title:'保障措施', core:'财政、税收、价格、政府采购、绿色金融等保障措施。', points:'第 127—132 条涵盖有关财政、税收、价格、采购及金融等支持机制。'},
    {number:'第九章', range:'第 137—147 条', title:'信息公开与公众参与', core:'生态环境信息公开、公众参与和社会监督。', points:'第 137 条涉及公民、法人和其他组织依法获取生态环境信息、参与和监督生态环境保护的权利。'}
  ];
  const chapterButtons = Array.from(document.querySelectorAll('.branch'));
  let currentChapter = 0;
  function showChapter(index) {
    currentChapter = Math.max(0, Math.min(chapters.length - 1, index));
    const chapter = chapters[currentChapter];
    document.getElementById('chapter-meta').textContent = chapter.number + ' · ' + chapter.range;
    document.getElementById('chapter-title').textContent = chapter.title;
    document.getElementById('chapter-core').textContent = chapter.core;
    document.getElementById('chapter-points').textContent = chapter.points;
    document.getElementById('chapter-count').textContent = (currentChapter + 1) + ' / ' + chapters.length;
    document.getElementById('previous-chapter').disabled = currentChapter === 0;
    document.getElementById('next-chapter').disabled = currentChapter === chapters.length - 1;
    chapterButtons.forEach(function (button, i) { const active = i === currentChapter; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  }
  chapterButtons.forEach(function (button, i) { button.addEventListener('click', function () { showChapter(i); }); });
  document.getElementById('previous-chapter').addEventListener('click', function () { showChapter(currentChapter - 1); });
  document.getElementById('next-chapter').addEventListener('click', function () { showChapter(currentChapter + 1); });

  function openHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!/^q[1-8]$/.test(id)) return;
    const target = document.getElementById(id);
    if (!target) return;
    if (target.tagName === 'DETAILS') {
      category = 'all'; search.value = '';
      filters.forEach(function (button) { const active = button.dataset.filter === 'all'; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
      applyFilters(); target.open = true;
    }
    target.scrollIntoView({block:'start'});
  }
  window.addEventListener('hashchange', openHash);
  if (location.hash) openHash();
}());
