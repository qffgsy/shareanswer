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
    var text = clean([item.subject, item.number, item.title, item.search].join(' ')).toLocaleLowerCase();
    return words.every(function (word) { return text.indexOf(word) !== -1; });
  }

  function extractWater(data) {
    var types = { '选择题': 'choice', '填空题': 'fill', '判断改错题': 'judge',
      '名词解释': 'term', '简答题': 'short', '论述题': 'essay' };
    return (Array.isArray(data) ? data : []).map(function (question) {
      var subject = question.source === 'chemical' ? '化学法习题' : '物理化学法习题';
      return {
        id: question.id, type: types[question.section], source: question.source,
        number: '第 ' + question.number + ' 题', title: clean(question.prompt), subject: subject,
        search: clean(['水污染控制工程', subject, question.section, question.prompt, question.answer, question.note, question.courseSource,
          (question.options || []).map(function (option) { return option.key + ' ' + option.text; }).join(' ')].join(' '))
      };
    }).filter(function (item) { return item.id && item.title && item.type; });
  }

  window.ShareAnswerCatalog = { extract: extract, extractWater: extractWater, matches: matches };
}());
