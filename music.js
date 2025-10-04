// music.js - 背景音乐播放器 (纯前端)
// 用法: 将音频文件放入 assets/music/ 目录 (建议 .mp3/.ogg/.webm)，更新 PLAYLIST。
// 访问页面点击右下角♫打开播放器。首次与页面交互后才能自动播放（浏览器策略限制）。
// 带 #edit 与否不影响播放。
(function(global){
  // ============== 播放列表来源说明 =================
  // 以下远程音频示例均来自 Pixabay (https://pixabay.com/music/) 免版权可商用，无需署名。
  // 若后续链接失效，可前往站点筛选“Calm / Ambient / Nature”再替换。
  // 为减少跨域失败风险，仍保留本地回退（assets/music/...）。
  // 你可以将远程文件下载后放到本地，并改成相对路径，以避免外网加载延迟。
  // =================================================

  // 远程播放列表暂时禁用，按照你的要求仅使用本地 assets/music 下的文件。
  const REMOTE_PLAYLIST = []; // 如果以后需要再加入远程链接，可把数组元素加回来。

  const LOCAL_FALLBACK = [
    {title: '春 · 微风(本地)', url: 'assets/music/spring_breeze.mp3', season:'spring'},
    {title: '夏 · 蝉鸣(本地)', url: 'assets/music/summer_cicada.mp3', season:'summer'},
    {title: '秋 · 细语(本地)', url: 'assets/music/autumn_whisper.mp3', season:'autumn'},
    {title: '冬 · 雪夜(本地)', url: 'assets/music/winter_night.mp3', season:'winter'}
  ];

  // 合并：远程优先，若本地存在同季节不足可补充（也可简单拼接）
  // 现在只使用本地曲目（文件名与季节对应）。
  const PLAYLIST = LOCAL_FALLBACK;

  const els = {
    launcher: document.getElementById('music-mini-launch'),
    player: document.getElementById('music-player'),
    toggle: document.getElementById('mp-toggle'),
    prev: document.getElementById('mp-prev'),
    next: document.getElementById('mp-next'),
    loop: document.getElementById('mp-loop'),
    volume: document.getElementById('mp-volume'),
    seek: document.getElementById('mp-seek'),
    title: document.getElementById('mp-title'),
    close: document.getElementById('mp-close'),
    showList: document.getElementById('mp-show-list'),
    playlist: document.getElementById('mp-playlist'),
    fantasy: document.getElementById('mp-fantasy')
  };

  let audio = new Audio();
  audio.preload = 'auto';
  audio.crossOrigin = 'anonymous';
  // 默认音量降低，若本地曾调节过则读取上次记忆
  try {
    const savedVol = localStorage.getItem('memories-volume');
    audio.volume = savedVol ? Math.min(1, Math.max(0, parseFloat(savedVol))) : 0.28; // 默认 ~30%
  } catch(e){ audio.volume = 0.28; }
  let index = 0;
  let isLoop = false;
  let userInteracted = false;
  let fantasyMode = (localStorage.getItem('memories-fantasy-mode')==='1');
  // 记录当前曲目所属季节，便于季节/日期切换时智能更换
  function seasonOf(monthIndex){ // monthIndex: 0-11
    const m = monthIndex+1;
    if([3,4,5].includes(m)) return 'spring';
    if([6,7,8].includes(m)) return 'summer';
    if([9,10,11].includes(m)) return 'autumn';
    return 'winter';
  }

  function pickSeasonIndex(){
    const season = seasonOf(new Date().getMonth());
    let list = PLAYLIST.filter(t=>t.season===season);
    if(fantasyMode){
      const keys=['幻想','奇幻','梦','fairy','magic','mystic','fantasy'];
      const filtered=list.filter(t=>keys.some(k=>t.title.toLowerCase().includes(k)||t.title.includes(k)));
      if(filtered.length) list=filtered;
    }
    if(list.length){
      const target = list[Math.floor(Math.random()*list.length)];
      const realIndex = PLAYLIST.findIndex(t=>t.url===target.url);
      if(realIndex>=0) index=realIndex;
    }
  }

  let preloadAbort = null;

  function load(i){
    if(!PLAYLIST.length){
      els.title.textContent='无可用曲目';
      return; }
    index = (i+PLAYLIST.length)%PLAYLIST.length;
    const track = PLAYLIST[index];
    // 预加载检测（HEAD 请求 / fetch 测试可访问性）
    try {
      if(preloadAbort) preloadAbort.abort();
      preloadAbort = new AbortController();
      fetch(track.url, {method:'GET', signal: preloadAbort.signal, headers:{'Range':'bytes=0-1024'}})
        .then(r=>{ if(!r.ok) throw 0; })
        .catch(()=>{ console.warn('[music] 远程音频访问失败，尝试仅在播放时加载。'); });
    } catch(e){}
    audio.src = track.url;
    els.title.textContent = track.title;
    audio.currentTime = 0;
    if(userInteracted) safePlay();
    highlightActive();
  }

  function safePlay(){
    if(!audio.src) return;
    audio.play().then(()=>{ els.toggle.textContent='⏸'; }).catch(()=>{ /* autoplay blocked */ });
  }

  function togglePlay(){
    if(!audio.src){ load(index); }
    if(audio.paused){ safePlay(); }
    else { audio.pause(); els.toggle.textContent='▶'; }
  }

  function next(){ if(!PLAYLIST.length) return; load(index+1); }
  function prev(){ if(!PLAYLIST.length) return; load(index-1); }

  function updateSeek(){
    if(!audio.duration || isNaN(audio.duration)) { els.seek.value=0; return; }
    els.seek.value = (audio.currentTime / audio.duration * 100).toFixed(2);
  }

  function seekTo(v){
    if(!audio.duration || isNaN(audio.duration)) return;
    audio.currentTime = v/100 * audio.duration;
  }

  function toggleLoop(){
    isLoop = !isLoop;
    els.loop.classList.toggle('active', isLoop);
    els.loop.style.background = isLoop ? 'linear-gradient(135deg,#16a34a,#22c55e)' : '';
  }

  // ============== 播放列表面板 ==============
  function fantasyFilter(track){
    if(!fantasyMode) return true;
    const keys=['幻想','奇幻','梦','fairy','magic','mystic','fantasy'];
    return keys.some(k=>track.title.toLowerCase().includes(k) || track.title.includes(k));
  }
  function buildPlaylist(){
    if(!els.playlist) return;
    els.playlist.innerHTML='';
    const currentSeason = (()=>{ const m=new Date().getMonth()+1; if([3,4,5].includes(m)) return 'spring'; if([6,7,8].includes(m)) return 'summer'; if([9,10,11].includes(m)) return 'autumn'; return 'winter';})();
    const seasonBadgeMap={spring:'春',summer:'夏',autumn:'秋',winter:'冬'};
    PLAYLIST.filter(fantasyFilter).forEach((t,i)=>{
      const div=document.createElement('div');
      div.className='mp-track';
      if(i===index) div.classList.add('active');
      const seasonTag=document.createElement('span');
      seasonTag.className='season-tag';
      seasonTag.textContent=seasonBadgeMap[t.season]||'·';
      const title=document.createElement('span');
      title.textContent=t.title;
      if(fantasyMode){
        const keys=['幻想','奇幻','梦','fairy','magic','mystic','fantasy'];
        if(keys.some(k=>t.title.toLowerCase().includes(k)||t.title.includes(k))){
          const b=document.createElement('span'); b.className='badge'; b.textContent='幻'; div.appendChild(b);
        }
      }
      div.append(seasonTag,title);
      div.addEventListener('click',()=>{ userInteracted=true; load(i); safePlay(); });
      els.playlist.appendChild(div);
    });
  }
  function highlightActive(){
    if(!els.playlist) return;
    [...els.playlist.querySelectorAll('.mp-track')].forEach((n,idx)=>{
      n.classList.toggle('active', idx===index);
    });
  }
  function togglePlaylist(){
    if(!els.playlist) return;
    els.playlist.classList.toggle('hidden');
    if(!els.playlist.classList.contains('hidden')) buildPlaylist();
  }
  function toggleFantasy(){
    fantasyMode=!fantasyMode;
    els.fantasy.classList.toggle('active', fantasyMode);
    els.fantasy.textContent = '奇幻模式:' + (fantasyMode?'开':'关');
    try { localStorage.setItem('memories-fantasy-mode', fantasyMode?'1':'0'); } catch(e){}
    pickSeasonIndex();
    load(index);
    if(!els.playlist.classList.contains('hidden')) buildPlaylist();
  }

  function showPlayer(){ els.player.classList.remove('hidden'); els.launcher.classList.add('hidden'); }
  function hidePlayer(){ els.player.classList.add('hidden'); els.launcher.classList.remove('hidden'); }

  // 事件绑定
  // 启动按钮：点击后立即尝试播放（符合用户手势）
  els.launcher.addEventListener('click', ()=>{ 
    userInteracted=true; 
    if(!audio.src) load(index); 
    showPlayer(); 
    if(audio.paused) safePlay();
  });
  els.close.addEventListener('click', hidePlayer);
  els.toggle.addEventListener('click', ()=>{ userInteracted=true; togglePlay(); });
  els.next.addEventListener('click', ()=>{ userInteracted=true; next(); });
  els.prev.addEventListener('click', ()=>{ userInteracted=true; prev(); });
  els.loop.addEventListener('click', toggleLoop);
  els.volume.addEventListener('input', e=>{ 
    audio.volume = parseFloat(e.target.value);
    try { localStorage.setItem('memories-volume', audio.volume.toFixed(2)); } catch(_){}
  });
  // 初始化滑块位置（若存在）
  if(els.volume && typeof audio.volume==='number'){ els.volume.value = audio.volume.toString(); }
  els.seek.addEventListener('input', e=> seekTo(parseFloat(e.target.value)) );
  if(els.showList) els.showList.addEventListener('click', ()=>{ userInteracted=true; togglePlaylist(); });
  if(els.fantasy) els.fantasy.addEventListener('click', ()=>{ userInteracted=true; toggleFantasy(); });

  audio.addEventListener('timeupdate', updateSeek);
  audio.addEventListener('ended', ()=>{ if(isLoop){ safePlay(); } else { next(); } });
  audio.addEventListener('loadedmetadata', updateSeek);

  // 首次用户点击页面任意位置后允许自动播放（若需要）
  function prime(){
    if(userInteracted) return;
    userInteracted=true;
    // 若之前已加载则直接尝试播放；若未加载先加载再播。
    if(!audio.src){ pickSeasonIndex(); load(index); }
    // 在同一个用户手势回调中触发播放，最大概率规避自动播放限制。
    if(audio.paused) safePlay();
    document.removeEventListener('pointerdown', prime, true);
  }
  document.addEventListener('pointerdown', prime, true);

  // 初始化：按季节挑一首但不自动播放，等交互。
  pickSeasonIndex();
  load(index);
  // 初始化 fantasy 按钮状态
  if(els.fantasy){ els.fantasy.classList.toggle('active', fantasyMode); els.fantasy.textContent='奇幻模式:'+(fantasyMode?'开':'关'); }

  // 暴露简单控制（可用于控制台）
  global.BGM = {play:()=>{userInteracted=true;togglePlay();},next,prev,list:PLAYLIST};
  // ========= 对外扩展：根据指定日期自动选择该季节音乐并可自动播放 =========
  function chooseTrackForSeason(season){
    let list = PLAYLIST.filter(t=>t.season===season);
    if(fantasyMode){
      const keys=['幻想','奇幻','梦','fairy','magic','mystic','fantasy'];
      const filtered=list.filter(t=>keys.some(k=>t.title.toLowerCase().includes(k)||t.title.includes(k)));
      if(filtered.length) list=filtered;
    }
    if(!list.length) return false;
    // 如果当前曲目仍是同季节就不切换
    const current = PLAYLIST[index];
    if(current && current.season===season) return false;
    const pick=list[Math.floor(Math.random()*list.length)];
    const realIndex=PLAYLIST.findIndex(t=>t.url===pick.url);
    if(realIndex>=0){ load(realIndex); return true; }
    return false;
  }
  function playSeasonFor(date){
    if(!date) date=new Date();
    const season=seasonOf(date.getMonth());
    const changed = chooseTrackForSeason(season);
    // 若用户已经交互并且音乐未播放则自动播放
    if(userInteracted){
      if(audio.paused) safePlay();
    }
    return changed;
  }
  global.BGM.playSeasonFor=playSeasonFor;
  global.BGM.enableFantasy=()=>{ if(!fantasyMode){ fantasyMode=true; localStorage.setItem('memories-fantasy-mode','1'); } };
  global.BGM.disableFantasy=()=>{ if(fantasyMode){ fantasyMode=false; localStorage.setItem('memories-fantasy-mode','0'); } };
})(window);
