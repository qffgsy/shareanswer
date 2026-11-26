(() => {
  'use strict';

  const search = document.getElementById('question-search');
  const chapterFilter = document.getElementById('chapter-filter');
  const status = document.getElementById('search-status');
  const noResults = document.getElementById('no-results');
  const chapters = Array.from(document.querySelectorAll('.chapter'));
  const questions = Array.from(document.querySelectorAll('.question'), (element) => ({
    element,
    text: element.textContent.normalize('NFKC').toLowerCase(),
  }));

  function filterQuestions() {
    const terms = search.value.normalize('NFKC').trim().toLowerCase().split(/\s+/).filter(Boolean);
    let count = 0;
    for (const question of questions) {
      const matchesChapter = !chapterFilter.value || question.element.dataset.chapter === chapterFilter.value;
      question.element.hidden = !matchesChapter || !terms.every((term) => question.text.includes(term));
      if (!question.element.hidden) count += 1;
    }
    for (const chapter of chapters) chapter.hidden = !chapter.querySelector('.question:not([hidden])');
    status.textContent = `显示 ${count} / ${questions.length} 题`;
    noResults.hidden = count !== 0;
  }

  function openLinkedQuestion() {
    const question = document.getElementById(window.location.hash.slice(1));
    if (!question || !question.classList.contains('question')) return;
    if (question.hidden) {
      search.value = '';
      chapterFilter.value = '';
      filterQuestions();
    }
    question.open = true;
    question.scrollIntoView({ block: 'start' });
  }

  search.addEventListener('input', filterQuestions);
  chapterFilter.addEventListener('change', filterQuestions);
  window.addEventListener('hashchange', openLinkedQuestion);
  filterQuestions();
  openLinkedQuestion();
})();
