(function () {
  'use strict';

  function clean(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function extract(doc) {
    var items = [];
    ['fill', 'choice'].forEach(function (kind) {
      doc.querySelectorAll('#' + kind + ' .quiz-card').forEach(function (card) {
        var heading = clean(card.querySelector('h3') && card.querySelector('h3').textContent);
        var question = clean(card.querySelector('p') && card.querySelector('p').textContent);
        items.push({ id: card.id, type: kind, number: heading, title: question,
          search: clean([heading, question, card.dataset.search, card.textContent].join(' ')) });
      });
    });

    doc.querySelectorAll('#short > h3').forEach(function (heading, index) {
      var parts = [], node = heading.nextElementSibling;
      while (node && node.tagName !== 'H3') { parts.push(node.textContent); node = node.nextElementSibling; }
      var title = clean(heading.textContent);
      items.push({ id: heading.id || 'short-' + (index + 1), type: 'short',
        number: '第 ' + (index + 1) + ' 题', title: title.replace(/^\d+\.\s*/, ''),
        search: clean([title].concat(parts).join(' ')) });
    });

    ['calc1', 'calc2', 'calc3', 'calc4', 'calc5', 'motor-circuit-6', 'motor-problem-7'].forEach(function (id, index) {
      var card = doc.getElementById(id);
      if (!card) return;
      var heading = card.querySelector('h2,h3');
      var detail = card.querySelector('.worked-content p:not(.fixed-note)');
      var title = clean(heading && heading.textContent).replace(/^\s*(?:四、)?计算题\s*\d+\s*[：:]\s*/, '').replace(/^\d+\.\s*/, '');
      items.push({ id: id, type: 'calculation', number: '第 ' + (index + 1) + ' 题', title: title,
        preview: clean(detail && detail.textContent).slice(0, 120),
        search: clean([title, card.textContent].join(' ')) });
    });
    return items;
  }

  function matches(item, query) {
    var words = clean(query).toLocaleLowerCase().split(' ').filter(Boolean);
    var text = clean([item.number, item.title, item.search].join(' ')).toLocaleLowerCase();
    return words.every(function (word) { return text.indexOf(word) !== -1; });
  }

  window.ShareAnswerCatalog = { extract: extract, matches: matches };
}());
