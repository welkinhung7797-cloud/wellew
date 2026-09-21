import { projects, editingReel, profile } from './content.js';
import { liveDemoMarkup, initLiveDemo } from './live-demo.js';

const $ = (selector, root = document) => root.querySelector(selector);
const gallery = $('#gallery');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const number = value => String(value).padStart(2, '0');
const poster = media => media.type === 'video' ? media.poster : media.src;
const collection = project => project.id === 'editing' ? editingReel : project.media;
const titlePug = pose => `<img class="title-pug" data-src="assets/pug/pose-${number(pose)}.svg" data-pose="${pose}" width="320" height="280" alt="" aria-hidden="true" decoding="async">`;
const headingParts = {
  kissko: ['AI VTuber', '親親子'], geo3d: ['3D', '資訊動畫'],
  compositing: ['虛實整合', '影片'], live: ['客製化', '直播元件'],
  discord: ['Discord', '架設'], gakey: ['AI 剪輯工作站', 'GAKEY']
};
const projectHeading = project => (headingParts[project.id] || [project.title])
  .map(part => `<span class="title-chunk">${escape(part)}</span>`).join(project.title.includes(' ') ? ' <wbr>' : '<wbr>');

function factsMarkup(project) {
  const facts = project.facts || [];
  if (project.id === 'live') return liveDemoMarkup();
  if (project.id === 'discord') return `<div class="facts-composition discord-composition"><p class="facts-label">COMMUNITY / DISCORD</p><div class="feature-selectors" aria-label="Discord 功能">${facts.map((fact, index) => `<button type="button" data-feature="${index}" aria-label="${escape(fact.title)}" aria-pressed="${index === 0}">${number(index + 1)}</button>`).join('')}</div><div class="feature-detail" aria-live="polite"><p class="feature-index">01 / 07</p><h3 id="feature-title">${escape(facts[0].title)}</h3><p id="feature-description">${escape(facts[0].description)}</p></div><div class="feature-footer"><span>從架構到日常互動</span><button type="button" id="next-feature">下一項 →</button></div></div>`;
  return `<div class="facts-composition"><p class="facts-label">${escape(project.en)} / WELLEW</p>${facts.map(fact => `<div class="fact-row"><b>${escape(fact.title)}</b><span>${escape(fact.description || fact.label)}</span></div>`).join('')}</div>`;
}

projects.forEach((project, index) => {
  const items = collection(project);
  const first = items[0];
  const section = document.createElement('section');
  section.id = project.id;
  section.className = 'page work-page';
  section.dataset.title = project.title;
  section.setAttribute('aria-labelledby', `${project.id}-title`);
  section.innerHTML = `<div class="work-copy">
    <p class="work-number"><span class="number">${number(index + 1)}</span><span>${escape(project.en)}</span></p>
    <div class="title-line"><h2 id="${project.id}-title" aria-label="${escape(project.title)}">${projectHeading(project)}</h2>${titlePug(index + 2)}</div>
    <p class="work-description project-subtitle">${escape(project.description)}</p>
    ${project.tags.length ? `<div class="work-tags">${project.tags.map(tag => `<span>${escape(tag)}</span>`).join('')}</div>` : ''}
    ${items.length ? `<button class="text-cta" type="button" data-project="${project.id}" data-media="0">看看作品 <span class="round-arrow" aria-hidden="true">↗</span></button>` : ''}
  </div>
  <div class="work-media">${first ? `<button class="artwork-button ${['kissko', 'community', 'gakey'].includes(project.id) ? 'contain' : ''}" type="button" data-project="${project.id}" data-media="0" aria-label="${escape(first.type === 'video' ? '播放：' : '放大：')}${escape(first.alt)}">
    <img data-src="${escape(poster(first))}" width="960" height="600" alt="${escape(first.alt)}" decoding="async">
    ${first.type === 'video' ? '<span class="play-circle" aria-hidden="true">▷</span>' : ''}
    <span class="media-open">${first.type === 'video' ? '播放作品' : '展開作品'} ↗</span>
    </button>
    <div class="work-caption"><span>${escape(first.caption)}</span><span>01 / ${number(items.length)}</span></div>
    ${items.length > 1 ? `<div class="preview-strip">${items.slice(1, 5).map((media, mediaIndex) => `<button type="button" data-project="${project.id}" data-media="${mediaIndex + 1}" aria-label="查看：${escape(media.alt)}"><img data-src="${escape(poster(media))}" width="64" height="40" alt="" decoding="async"></button>`).join('')}<span>${items.length} 件作品</span></div>` : ''}` : factsMarkup(project)}</div>`;
  gallery.append(section);
});
initLiveDemo($('#live'));

const contact = document.createElement('section');
contact.id = 'contact';
contact.className = 'page contact-page';
contact.dataset.title = '聊聊合作';
contact.setAttribute('aria-labelledby', 'contact-title');
contact.innerHTML = `<div class="contact-copy"><p class="eyebrow"><span class="small-line"></span> ABOUT WELKIN / SAY HELLO</p><div class="title-line"><h2 id="contact-title">下一個故事，<br>從<em>聊聊</em>開始。</h2>${titlePug(12)}</div><p class="intro project-subtitle">${escape(profile.description)}</p><a class="contact-email" href="mailto:${escape(profile.email)}">${escape(profile.email)} <span aria-hidden="true">↗</span></a><div class="contact-links"><span>LINE / ${escape(profile.line)}</span><a href="${escape(profile.itchUrl)}" target="_blank" rel="noopener noreferrer">ITCH.IO / GRAFFITI FIGHT ↗</a></div></div><div class="contact-bottom"><span>WELLEW STUDIO © 2026</span><a href="#home">再走一遍 ↶</a></div>`;
gallery.append(contact);

const pages = [...gallery.querySelectorAll('.page')];
const dots = $('#page-dots');
$('#page-total').textContent = number(pages.length);
dots.innerHTML = pages.map((page, index) => `<button type="button" class="page-dot" data-page-index="${index}" aria-label="第 ${index + 1} 頁：${escape(page.dataset.title)}"></button>`).join('');
$('#index-list').innerHTML = projects.map((project, index) => `<button class="index-item" type="button" data-page-index="${index + 1}"><span>${number(index + 1)}</span><span>${escape(project.title)}</span><span aria-hidden="true">↗</span></button>`).join('');
let activeIndex = 0;
let pendingIndex = null;
let pendingPugIndex = null;

async function introduceProject(index) {
  if (pendingPugIndex !== index) return;
  pendingPugIndex = null;
  const sprite = $('.title-pug', pages[index]);
  await sprite.decode().catch(() => {});
  if (activeIndex !== index || reduceMotion.matches) return;
  sprite.animate([
    { transform: 'translate(-18px, 0) rotate(-4deg)' },
    { transform: 'translate(-10px, -4px) rotate(2deg)', offset: .4 },
    { transform: 'translate(-4px, 0) rotate(-2deg)', offset: .72 },
    { transform: 'translate(0, 0) rotate(0)' }
  ], { duration: 460, easing: 'ease-out' });
}

function loadPageImages(index) {
  // Only the current page and its neighbour request preview images; never video files.
  for (const page of pages.slice(Math.max(0, index - 1), Math.min(pages.length, index + 2))) {
    page.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
      delete img.dataset.src;
    });
  }
}

function activate(index, updateHash = true) {
  const changed = activeIndex !== index;
  activeIndex = index;
  document.body.dataset.page = index === 0 ? 'home' : index === pages.length - 1 ? 'contact' : 'work';
  $('#page-number').textContent = number(index + 1);
  $('#current-title').textContent = pages[index].dataset.title;
  loadPageImages(index);
  if (changed) {
    gallery.querySelectorAll('.title-pug').forEach(pug => pug.getAnimations().forEach(animation => animation.cancel()));
    pendingPugIndex = index;
  }
  $('#previous').disabled = index === 0;
  $('#next').disabled = index === pages.length - 1;
  [...dots.children].forEach((dot, i) => i === index ? dot.setAttribute('aria-current', 'page') : dot.removeAttribute('aria-current'));
  pages.forEach((page, i) => { page.inert = i !== index; });
  $('#page-announcement').textContent = `第 ${index + 1} 頁，共 ${pages.length} 頁：${pages[index].dataset.title}`;
  if (updateHash && location.hash !== `#${pages[index].id}`) history.replaceState(null, '', `#${pages[index].id}`);
}

function goTo(index, options = {}) {
  index = Math.max(0, Math.min(pages.length - 1, index));
  pendingIndex = index;
  if (options.push && location.hash !== `#${pages[index].id}`) history.pushState(null, '', `#${pages[index].id}`);
  activate(index);
  gallery.scrollTo({ left: pages[index].offsetLeft, behavior: reduceMotion.matches || options.instant ? 'instant' : 'smooth' });
  if (options.focus) {
    const heading = pages[index].querySelector('h1,h2');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}

const pageObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.intersectionRatio < .6) continue;
    const index = pages.indexOf(entry.target);
    if (pendingIndex !== null && index !== pendingIndex) continue;
    pendingIndex = null;
    if (index !== activeIndex) activate(index);
    if (entry.intersectionRatio >= .95) introduceProject(index);
  }
}, { root: gallery, threshold: [.6, .95] });
pages.forEach(page => pageObserver.observe(page));

$('#previous').addEventListener('click', () => goTo(activeIndex - 1, { push: true }));
$('#next').addEventListener('click', () => goTo(activeIndex + 1, { push: true }));
document.addEventListener('click', event => {
  const pageButton = event.target.closest('[data-page-index]');
  if (pageButton) {
    const inIndex = pageButton.closest('dialog');
    inIndex?.close();
    goTo(Number(pageButton.dataset.pageIndex), { push: true, focus: !!inIndex });
    return;
  }
  const anchor = event.target.closest('a[href^="#"]');
  if (anchor) {
    const id = anchor.getAttribute('href').slice(1);
    if (id === 'gallery') {
      event.preventDefault();
      gallery.focus({ preventScroll: true });
      return;
    }
    const index = pages.findIndex(page => page.id === id);
    if (index < 0) return;
    event.preventDefault();
    goTo(index, { push: true, focus: true });
  }
  const mediaButton = event.target.closest('[data-project]');
  if (mediaButton) {
    const project = projects.find(project => project.id === mediaButton.dataset.project);
    openMedia(project.title, project.en, collection(project), Number(mediaButton.dataset.media));
  }
});

// A normal mouse wheel travels horizontally; touch and trackpads retain native scrolling.
// One gesture moves one page, with a short lock against high-frequency wheel events.
let wheelLockedUntil = 0;
let wheelDistance = 0;
let lastWheel = 0;
gallery.addEventListener('wheel', event => {
  if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || Math.abs(event.deltaY) < 1) return;
  event.preventDefault();
  const now = performance.now();
  if (now < wheelLockedUntil) return;
  if (now - lastWheel > 180) wheelDistance = 0;
  lastWheel = now;
  wheelDistance += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? gallery.clientHeight : 1);
  if (Math.abs(wheelDistance) < 35) return;
  goTo(activeIndex + Math.sign(wheelDistance));
  wheelDistance = 0;
  wheelLockedUntil = now + 650;
}, { passive: false });
gallery.addEventListener('touchstart', () => { pendingIndex = null; }, { passive: true });
gallery.addEventListener('wheel', event => { if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) pendingIndex = null; }, { passive: true });
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('dialog,input,textarea,select,video,[contenteditable="true"],[data-no-page-keys]')) return;
  const index = ({ ArrowRight: activeIndex + 1, ArrowLeft: activeIndex - 1, Home: 0, End: pages.length - 1 })[event.key];
  if (index === undefined) return;
  event.preventDefault();
  goTo(index, { push: true });
});

function readHash() {
  const index = pages.findIndex(page => `#${page.id}` === location.hash);
  goTo(index < 0 ? 0 : index, { instant: true });
}
window.addEventListener('popstate', readHash);
window.addEventListener('hashchange', readHash);
let lastWidth = gallery.clientWidth;
new ResizeObserver(() => {
  if (gallery.clientWidth === lastWidth) return;
  lastWidth = gallery.clientWidth;
  goTo(activeIndex, { instant: true });
}).observe(gallery);

const indexDialog = $('#index-dialog');
const mediaDialog = $('#media-dialog');
$('#open-index').addEventListener('click', () => indexDialog.showModal());
let featureIndex = 0;
function selectFeature(index) {
  const features = projects.find(project => project.id === 'discord').facts;
  featureIndex = index % features.length;
  $('#feature-title').textContent = features[featureIndex].title;
  $('#feature-description').textContent = features[featureIndex].description;
  $('.feature-index').textContent = `${number(featureIndex + 1)} / ${number(features.length)}`;
  document.querySelectorAll('[data-feature]').forEach((button, i) => button.setAttribute('aria-pressed', String(i === featureIndex)));
}
document.querySelectorAll('[data-feature]').forEach(button => button.addEventListener('click', () => selectFeature(Number(button.dataset.feature))));
$('#next-feature').addEventListener('click', () => selectFeature(featureIndex + 1));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});

let viewerItems = [];
let viewerIndex = 0;
function clearMedia() {
  const video = $('#media-stage video');
  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
  $('#media-stage').replaceChildren();
}

function renderMedia(index) {
  viewerIndex = index;
  clearMedia();
  const media = viewerItems[index];
  const element = document.createElement(media.type === 'video' ? 'video' : 'img');
  if (media.type === 'video') {
    element.controls = true;
    element.playsInline = true;
    element.preload = 'none';
    element.poster = media.poster;
    element.setAttribute('aria-label', media.alt);
  } else {
    element.alt = media.alt;
  }
  element.src = media.src;
  element.addEventListener('error', () => {
    const message = document.createElement('p');
    message.className = 'media-error';
    message.innerHTML = `這個預覽暫時無法顯示。<a href="${escape(media.src)}" target="_blank" rel="noopener">開啟原始作品 ↗</a>`;
    $('#media-stage').replaceChildren(message);
  }, { once: true });
  $('#media-stage').append(element);
  $('#media-caption').textContent = media.caption || media.title;
  $('#media-counter').textContent = `${number(index + 1)} / ${number(viewerItems.length)}`;
  $('#media-thumbnails').querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-current', String(i === index)));
  // Playback follows this explicit click; a blocked play promise leaves native controls available.
  if (media.type === 'video') element.play().catch(() => {});
}

function openMedia(title, category, items, index = 0) {
  viewerItems = items;
  $('#media-title').textContent = title;
  $('#media-category').textContent = category;
  $('#media-thumbnails').innerHTML = items.map((media, i) => `<button type="button" class="media-thumb" data-viewer-index="${i}" aria-label="查看：${escape(media.alt)}"><img src="${escape(poster(media))}" alt="" loading="lazy" width="95" height="55"><span>${escape(media.caption || media.title)}</span></button>`).join('');
  mediaDialog.showModal();
  renderMedia(index);
}
$('#media-thumbnails').addEventListener('click', event => {
  const button = event.target.closest('[data-viewer-index]');
  if (button) renderMedia(Number(button.dataset.viewerIndex));
});
mediaDialog.addEventListener('close', () => {
  clearMedia();
  $('#media-thumbnails').replaceChildren();
  viewerItems = [];
});
mediaDialog.addEventListener('keydown', event => {
  if (event.target.closest('video') || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  renderMedia(Math.max(0, Math.min(viewerItems.length - 1, viewerIndex + (event.key === 'ArrowRight' ? 1 : -1))));
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) $('#media-stage video')?.pause();
});
$('#home-reel').addEventListener('click', () => openMedia('影音剪輯精選', 'WELLEW / SELECTED REEL', editingReel));
readHash();
