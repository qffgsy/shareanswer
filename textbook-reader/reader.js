import * as pdfjs from './vendor/pdf.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', import.meta.url).href;
const $ = id => document.getElementById(id);
const status = $('status'), entry = $('entry'), controls = $('controls'), wrap = $('canvas-wrap');
let pdf = null, pageNum = 1, zoom = 1, rendering = null, sequence = 0;
function decodeKey(fragment) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(fragment)) throw new Error('invalid key');
  const raw = atob(fragment.replace(/-/g, '+').replace(/_/g, '/') + '=');
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
function shareKey(value) {
  const text = value.trim();
  if (/^[A-Za-z0-9_-]{43}$/.test(text)) return text;
  try { return new URL(text).hash.slice(1); } catch { return ''; }
}
async function openBook(keyText) {
  let key;
  try { key = decodeKey(keyText); } catch {
    entry.hidden = false; status.textContent = '请使用完整的专属阅读链接。'; return;
  }
  entry.hidden = true; status.textContent = '正在加载加密课本，首次打开可能需要一点时间…';
  try {
    const response = await fetch('./book.bin');
    if (!response.ok) throw new Error('load failed');
    const encrypted = new Uint8Array(await response.arrayBuffer());
    const cryptoKey = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({name:'AES-GCM', iv:encrypted.slice(0,12)}, cryptoKey, encrypted.slice(12));
    pdf = await pdfjs.getDocument({data:new Uint8Array(plain),isEvalSupported:false}).promise;
    $('page').max = pdf.numPages; $('page-total').textContent = `/ ${pdf.numPages} 页`;
    controls.hidden = false; wrap.hidden = false; status.textContent = '课本已打开';
    await renderPage();
  } catch (e) {
    entry.hidden = false; controls.hidden = true; wrap.hidden = true;
    status.textContent = '无法打开课本，请检查链接是否完整及网络连接。';
  }
}
async function renderPage() {
  if (!pdf) return;
  const current = ++sequence;
  if (rendering) { rendering.cancel(); try { await rendering.promise; } catch {} }
  const page = await pdf.getPage(pageNum);
  if (current !== sequence) return;
  const viewport = page.getViewport({scale:1});
  const available = Math.max(200, wrap.clientWidth - 32);
  const cssScale = available / viewport.width * zoom;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const target = page.getViewport({scale:cssScale * ratio});
  const canvas = $('page-canvas'); canvas.width = Math.floor(target.width); canvas.height = Math.floor(target.height);
  canvas.style.width = `${Math.floor(target.width / ratio)}px`; canvas.style.height = `${Math.floor(target.height / ratio)}px`;
  $('page').value = pageNum; $('prev').disabled = pageNum === 1; $('next').disabled = pageNum === pdf.numPages;
  $('zoom-value').textContent = `${Math.round(zoom * 100)}%`;
  rendering = page.render({canvasContext:canvas.getContext('2d'),viewport:target});
  try { await rendering.promise; } catch (e) { if (e.name !== 'RenderingCancelledException') status.textContent = '本页显示失败，请重试。'; }
}
$('open-link').addEventListener('click', () => { const key = shareKey($('share-link').value); if (key) location.hash = key; openBook(key); });
$('prev').addEventListener('click', () => { if (pageNum > 1) { pageNum--; renderPage(); } });
$('next').addEventListener('click', () => { if (pdf && pageNum < pdf.numPages) { pageNum++; renderPage(); } });
$('page').addEventListener('change', e => { const n = Number(e.target.value); if (Number.isInteger(n) && n >= 1 && n <= pdf.numPages) { pageNum = n; renderPage(); } else e.target.value = pageNum; });
$('zoom-out').addEventListener('click', () => { zoom = Math.max(.5, zoom-.25); renderPage(); });
$('zoom-in').addEventListener('click', () => { zoom = Math.min(2.5, zoom+.25); renderPage(); });
$('fit').addEventListener('click', () => { zoom = 1; renderPage(); });
let resizeTimer; window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(renderPage,200); });
openBook(location.hash.slice(1));
