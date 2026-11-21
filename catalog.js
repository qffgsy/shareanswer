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

  // 课程复习页的七项作业和法典思维导图；锚点与原页面保持一致。
  function extractLaw() {
    var entries = [
      ['介绍一部家乡的地方环境保护法规，并体现其地方特色。', '安庆市 长江江豚保护条例 地方立法 生物多样性'],
      ['比较《环境保护法》与《生态环境法典》基本规定的异同，列举新旧法之间的差异。', '新旧法律比较 法典 环保法 环境法'],
      ['结合环境专业知识，谈谈环境专业如何支撑监督管理智能化发展。', '环境监管 遥感 监测 大数据 人工智能'],
      ['介绍一部家乡的环境保护标准，并与国家标准进行比较。', '安徽 水泥 工业大气污染物排放标准 颗粒物 二氧化硫 氮氧化物 DB34 3576 GB4915'],
      ['从生态环境法典编纂的角度，分析为什么“污染防治”与“生态保护”需要独立成编。', '环境立法体系 生态系统 保护 污染治理'],
      ['对于新能源车企与发电厂、电池生产企业，从立法角度谈谈如何调整结构，实现全链条大气污染控制？', '新能源汽车 电池 发电厂 全生命周期 绿色供应链'],
      ['辨析达“标”排放与水体达“标”中“标”的差异。', '达标排放 水环境质量标准 污染物排放标准 地表水'],
      ['《生态环境法典》总则编包含哪些内容？其法律体系如何构成？', '法典导图 章节 监督管理 分区管控 标准监测 生态环境影响评价 公众参与']
    ];
    return entries.map(function (entry, index) {
      return { id: 'q' + (index + 1), source: 'environmental-law', subject: '环境法律法规',
        type: 'coursework', number: index === 7 ? '学习任务' : '第 ' + (index + 1) + ' 题',
        title: entry[0], search: clean(entry.join(' ')) };
    });
  }

  window.ShareAnswerCatalog = { extract: extract, extractWater: extractWater, extractLaw: extractLaw, matches: matches };
}());
