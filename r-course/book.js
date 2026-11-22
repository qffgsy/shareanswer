import * as pdfjs from '../textbook-reader/vendor/pdf.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = new URL('../textbook-reader/vendor/pdf.worker.min.mjs', import.meta.url).href;
const $ = id => document.getElementById(id);
const parts = [[1,45],[46,90],[91,135],[136,180],[181,225],[226,270],[271,315],[316,360],[361,405]];
let current = Math.max(1,Math.min(405,Number(new URLSearchParams(location.search).get('page')) || 1));
let zoom = 1, doc = null, loadedPart = -1, task = null, sequence = 0;
function filename(part) { return `book-${String(part[0]).padStart(3,'0')}-${String(part[1]).padStart(3,'0')}.pdf`; }
async function render() {
  const seq=++sequence, idx=parts.findIndex(([start,end])=>current>=start && current<=end), part=parts[idx];
  $('page').value=current; $('prev').disabled=current===1; $('next').disabled=current===405; $('zoom').textContent=`${Math.round(zoom*100)}%`;
  $('pdf-link').href=`textbook/${filename(part)}#page=${current-part[0]+1}`;
  if(task){task.cancel();try{await task.promise;}catch{}}
  try {
    if(idx!==loadedPart){ $('status').textContent=`正在加载第 ${part[0]}—${part[1]} 页…`; const next=await pdfjs.getDocument(`textbook/${filename(part)}`).promise; if(seq!==sequence){next.destroy();return;} if(doc)doc.destroy();doc=next;loadedPart=idx; }
    const page=await doc.getPage(current-part[0]+1);if(seq!==sequence)return;
    $('controls').hidden=false;$('page-wrap').hidden=false;
    const base=page.getViewport({scale:1}), area=Math.max(200,$('page-wrap').clientWidth-32), ratio=Math.min(window.devicePixelRatio||1,2), viewport=page.getViewport({scale:area/base.width*zoom*ratio});
    const canvas=$('canvas');canvas.width=Math.floor(viewport.width);canvas.height=Math.floor(viewport.height);canvas.style.width=`${Math.floor(viewport.width/ratio)}px`;canvas.style.height=`${Math.floor(viewport.height/ratio)}px`;
    $('controls').hidden=false;$('page-wrap').hidden=false;$('status').textContent=`第 ${current} 页 / 共 405 页`;
    task=page.render({canvasContext:canvas.getContext('2d'),viewport});try{await task.promise;}catch(e){if(e.name!=='RenderingCancelledException')throw e;}
  } catch(e) { if(seq===sequence)$('status').textContent='课本加载失败，请检查网络后刷新重试，或使用下方 PDF 链接。'; }
}
$('prev').addEventListener('click',()=>{if(current>1){current--;render();}});$('next').addEventListener('click',()=>{if(current<405){current++;render();}});
$('page').addEventListener('change',e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>=1&&n<=405){current=n;render();}else e.target.value=current;});
$('zoom-out').addEventListener('click',()=>{zoom=Math.max(.5,zoom-.25);render();});$('zoom-in').addEventListener('click',()=>{zoom=Math.min(2.5,zoom+.25);render();});$('fit').addEventListener('click',()=>{zoom=1;render();});
let timer;window.addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(render,200);});render();
