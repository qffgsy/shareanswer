const search = document.getElementById('search');
const cards = [...document.querySelectorAll('.lecture')];
search.addEventListener('input', () => {
  const q = search.value.trim().toLowerCase();
  let count = 0;
  for (const card of cards) {
    const match = `${card.dataset.search} ${card.textContent}`.toLowerCase().includes(q);
    card.hidden = !match;
    if (match) count++;
  }
  document.getElementById('empty').hidden = count > 0;
});
