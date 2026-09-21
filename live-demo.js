const features = [
  ['chat', '留言疊圖', '聊天室留言疊圖'],
  ['vote', '即時投票', '即時投票系統'],
  ['goal', '斗內目標', '斗內目標進度條'],
  ['hype', 'HYPE 計數', '洗版留言 → HYPE 計數'],
  ['marquee', '斗內跑馬燈', '斗內跑馬燈']
];
const instances = new WeakMap();
let nextId = 0;

/** Return a self-contained, local-only interactive livestream component. */
export function liveDemoMarkup() {
  const id = `live-demo-${++nextId}`;
  const panel = (key, title, content, controls) => `<section class="live-panel" data-live-panel="${key}" aria-labelledby="${id}-${key}-title" ${key === 'chat' ? '' : 'hidden'}><h3 class="live-panel-title" id="${id}-${key}-title">${title}</h3>${content}${controls}</section>`;
  return `<div class="live-demo" data-live-demo data-no-page-keys>
    <div class="live-heading"><span class="live-kicker"><i aria-hidden="true"></i>互動示範<span class="live-local-note">・在這裡試試看</span></span><button class="live-reset" type="button" data-live-action="reset">重設</button></div>
    <div class="live-selectors" role="group" aria-label="選擇直播元件">${features.map(([key, short, full], index) => `<button class="live-selector" type="button" data-live-select="${key}" aria-label="${full}" aria-pressed="${index === 0}" aria-controls="${id}-${key}"><span class="live-selector-number">0${index + 1}</span><span>${short}</span></button>`).join('')}</div>
    ${panel('chat', '聊天室留言疊圖', `<div class="live-stage live-chat-stage"><span class="live-stage-label">CHAT OVERLAY</span><div class="live-chat-messages" role="log" aria-label="留言預覽" aria-live="polite" aria-relevant="additions"><div class="live-chat-message"><span class="live-avatar" aria-hidden="true">W</span><div><b>Welkin</b><p>把觀眾的聲音，放進畫面。</p></div></div><div class="live-chat-message"><span class="live-avatar live-avatar-sage" aria-hidden="true">觀</span><div><b>示範觀眾</b><p>想看剪輯幕後。</p></div></div></div></div>`, `<form class="live-controls live-chat-form"><label class="live-sr-only" for="${id}-chat-input">要放上畫面的留言</label><input class="live-input" id="${id}-chat-input" name="message" maxlength="44" placeholder="輸入一句話…" autocomplete="off" required><button class="live-action live-action-primary" type="submit">送出</button></form>`)}
    ${panel('vote', '即時投票系統', `<div class="live-stage live-vote-stage"><div class="live-poll-heading"><span>下一集想看什麼？</span><span class="live-vote-total">0 票</span></div><div class="live-vote-options">${['企劃幕後', '剪輯技巧', '直播實測'].map((label, index) => `<button class="live-vote-option" type="button" data-live-vote="${index}" aria-label="投給${label}"><span class="live-vote-fill" aria-hidden="true"></span><span class="live-vote-name">${label}</span><span class="live-vote-value">0 票 · 0%</span></button>`).join('')}</div></div>`, '<div class="live-controls live-help">點選畫面中的選項，每次投一票。</div>')}
    ${panel('goal', '斗內目標進度條', '<div class="live-stage live-goal-stage"><span class="live-stage-label">NEXT GOAL</span><p class="live-goal-title">下一台直播設備</p><p class="live-goal-amount"><strong>NT$ <span data-live-amount>0</span></strong><span>／ 1,000</span></p><div class="live-goal-track" role="progressbar" aria-label="模擬斗內目標" aria-valuemin="0" aria-valuemax="1000" aria-valuenow="0"><span class="live-goal-fill"></span></div><span class="live-goal-progress">0% 達成</span></div>', '<div class="live-controls"><button class="live-action live-action-primary" type="button" data-live-donate="100">模擬 +100</button><button class="live-action" type="button" data-live-donate="500">模擬 +500</button><span class="live-control-note">不會付款</span></div>')}
    ${panel('hype', '洗版留言 → HYPE 計數', '<div class="live-stage live-hype-stage"><span class="live-stage-label">CHAT ENERGY</span><div class="live-hype-meter"><strong class="live-hype-count">0</strong><span>HYPE!</span></div><span class="live-hype-state">每則 HYPE 留言，能量 +1</span><div class="live-hype-messages" aria-hidden="true"><span>HYPE!</span><span>HYPE!</span><span>HYPE!</span></div></div>', '<div class="live-controls"><button class="live-action live-action-primary" type="button" data-live-hype="1">送出 HYPE +1</button><button class="live-action" type="button" data-live-hype="10">模擬連發 +10</button></div>')}
    ${panel('marquee', '斗內跑馬燈', '<div class="live-stage live-marquee-stage"><span class="live-stage-label">SUPPORTER TICKER</span><div class="live-marquee-screen"><span class="live-marquee-corner" aria-hidden="true">WELLEW LIVE</span><div class="live-marquee-track"><span class="live-marquee-message">謝謝示範觀眾的支持 · NT$100</span></div></div></div>', `<form class="live-controls live-marquee-form"><label class="live-sr-only" for="${id}-marquee-input">跑馬燈訊息</label><input class="live-input" id="${id}-marquee-input" name="ticker" maxlength="44" value="謝謝示範觀眾的支持 · NT$100" autocomplete="off" required><button class="live-action live-action-primary" type="submit">播放一次</button></form>`)}
    <p class="live-sr-only live-announcement" role="status" aria-live="polite"></p>
  </div>`
    // Unique regions allow more than one copy to be mounted safely.
    .replaceAll(/data-live-panel="([a-z]+)"/g, (_, key) => `data-live-panel="${key}" id="${id}-${key}"`);
}

/** Bind a rendered component; returns a cleanup function. Safe to call twice. */
export function initLiveDemo(root) {
  const component = root?.matches?.('[data-live-demo]') ? root : root?.querySelector?.('[data-live-demo]');
  if (!component) return () => {};
  if (instances.has(component)) return instances.get(component);
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const $ = selector => component.querySelector(selector);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const state = { selected: 'chat', votes: [0, 0, 0], amount: 0, hype: 0 };
  const originalChat = $('.live-chat-messages').innerHTML;
  const defaultTicker = $('.live-marquee-form input').value;
  let animation = null;
  const announce = message => { $('.live-announcement').textContent = message; };
  const cancelMotion = () => { animation?.cancel(); animation = null; };

  function updateVotes() {
    const total = state.votes.reduce((sum, count) => sum + count, 0);
    $('.live-vote-total').textContent = `${total} 票`;
    // Largest-remainder rounding keeps the displayed percentages at 100%.
    const exact = state.votes.map(count => total ? count / total * 100 : 0);
    const percentages = exact.map(Math.floor);
    if (total) {
      const order = exact.map((value, index) => ({ index, fraction: value - percentages[index] })).sort((a, b) => b.fraction - a.fraction);
      const remainder = 100 - percentages.reduce((sum, value) => sum + value, 0);
      for (let i = 0; i < remainder; i++) percentages[order[i].index]++;
    }
    component.querySelectorAll('[data-live-vote]').forEach((button, index) => {
      button.querySelector('.live-vote-value').textContent = `${state.votes[index]} 票 · ${percentages[index]}%`;
      button.querySelector('.live-vote-fill').style.transform = `scaleX(${percentages[index] / 100})`;
    });
  }

  function updateGoal() {
    const value = Math.min(state.amount, 1000);
    $('[data-live-amount]').textContent = state.amount.toLocaleString('en-US');
    $('.live-goal-track').setAttribute('aria-valuenow', String(value));
    $('.live-goal-track').setAttribute('aria-valuetext', `模擬 ${state.amount} 元，目標 1000 元`);
    $('.live-goal-fill').style.transform = `scaleX(${value / 1000})`;
    $('.live-goal-progress').textContent = state.amount >= 1000 ? '目標達成！' : `${Math.round(value / 10)}% 達成`;
  }

  function updateHype() {
    $('.live-hype-count').textContent = state.hype.toLocaleString('en-US');
    $('.live-hype-state').textContent = state.hype >= 25 ? '全場沸騰！' : state.hype >= 10 ? '聊天室熱起來了！' : state.hype ? '收到！繼續集氣。' : '每則 HYPE 留言，能量 +1';
    $('.live-hype-messages').classList.toggle('live-hype-active', state.hype > 0);
  }

  function select(key) {
    if (!features.some(feature => feature[0] === key)) return;
    cancelMotion();
    state.selected = key;
    component.querySelectorAll('[data-live-select]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.liveSelect === key)));
    component.querySelectorAll('[data-live-panel]').forEach(panel => { panel.hidden = panel.dataset.livePanel !== key; });
    // Focus stays on the clicked selector, without scrolling the outer gallery.
  }

  function reset() {
    cancelMotion();
    state.votes = [0, 0, 0];
    state.amount = state.hype = 0;
    updateVotes(); updateGoal(); updateHype();
    $('.live-chat-messages').innerHTML = originalChat;
    $('.live-chat-form').reset();
    $('.live-marquee-form').reset();
    $('.live-marquee-message').textContent = defaultTicker;
    announce('所有互動示範已重設。');
  }

  component.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || !component.contains(button)) return;
    if (button.dataset.liveSelect) select(button.dataset.liveSelect);
    if (button.dataset.liveAction === 'reset') reset();
    if (button.hasAttribute('data-live-vote')) {
      const index = Number(button.dataset.liveVote);
      state.votes[index]++;
      updateVotes();
      announce(`已投給${button.querySelector('.live-vote-name').textContent}，目前 ${state.votes[index]} 票。`);
    }
    if (button.dataset.liveDonate) {
      state.amount += Number(button.dataset.liveDonate);
      updateGoal();
      announce(`模擬金額 ${state.amount} 元${state.amount >= 1000 ? '，目標達成' : ''}。`);
    }
    if (button.dataset.liveHype) {
      state.hype += Number(button.dataset.liveHype);
      updateHype();
      announce(`目前 ${state.hype} HYPE。`);
    }
  }, options);

  component.addEventListener('submit', event => {
    const form = event.target;
    if (!form.matches('.live-chat-form,.live-marquee-form')) return;
    event.preventDefault();
    const input = form.querySelector('input');
    const text = input.value.trim();
    if (!text) { announce('先輸入一句話，再試一次。'); return; }
    if (form.matches('.live-chat-form')) {
      const message = document.createElement('div');
      message.className = 'live-chat-message';
      message.innerHTML = '<span class="live-avatar live-avatar-sage" aria-hidden="true">你</span><div><b>你</b><p></p></div>';
      message.querySelector('p').textContent = text;
      const messages = $('.live-chat-messages');
      while (messages.children.length >= 2) messages.firstElementChild.remove();
      messages.append(message);
      input.value = '';
    } else {
      cancelMotion();
      const ticker = $('.live-marquee-message');
      ticker.textContent = text;
      if (reducedMotion.matches || typeof ticker.animate !== 'function') {
        announce('跑馬燈訊息已顯示；依減少動態設定保持靜止。');
        return;
      }
      const track = $('.live-marquee-track');
      animation = ticker.animate([
        { transform: `translateX(${track.clientWidth}px)` },
        { transform: `translateX(${-ticker.scrollWidth}px)` }
      ], { duration: 4800, iterations: 1, easing: 'linear' });
      animation.onfinish = () => { animation = null; announce('跑馬燈已播放一次。'); };
      announce('跑馬燈播放中，僅播放一次。');
    }
  }, options);
  reducedMotion.addEventListener('change', event => { if (event.matches) cancelMotion(); }, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelMotion(); }, options);
  const cleanup = () => { cancelMotion(); controller.abort(); instances.delete(component); };
  instances.set(component, cleanup);
  return cleanup;
}
