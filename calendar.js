// calendar.js - 主界面逻辑
(function(){
  const container=document.getElementById('calendar-container');
  let current=new Date();
  current.setDate(1);
  const CAN_EDIT = PublicDiary.hasEditPrivilege();
  // 异步加载文件型日记清单，完成后若已渲染再补一次渲染以显示指示点
  if(PublicDiary.loadDiaryManifest){
    PublicDiary.loadDiaryManifest().then(()=>{ try { render(); } catch(e){} });
  }

  function buildHeader(){
    const h=document.createElement('div');h.className='calendar-header';
    const prev=document.createElement('button');prev.className='nav-btn';prev.innerHTML='‹ 上月';
    const next=document.createElement('button');next.className='nav-btn';next.innerHTML='下月 ›';
    const title=document.createElement('h2'); title.id='cal-title';
    prev.addEventListener('click',()=>{current.setMonth(current.getMonth()-1);render();});
    next.addEventListener('click',()=>{current.setMonth(current.getMonth()+1);render();});
    h.append(prev,title,next);return h;
  }

  function getMonthDays(year,month){return new Date(year,month+1,0).getDate();}

  function render(){
    container.innerHTML='';
    const header=buildHeader();
    container.appendChild(header);
    const grid=document.createElement('div');grid.className='calendar-grid';
    const now=new Date();
    const y=current.getFullYear(), m=current.getMonth();
    document.getElementById('cal-title').textContent= `${y}年 ${m+1}月`;
    // 星期标题
    ['日','一','二','三','四','五','六'].forEach(d=>{ const e=document.createElement('div'); e.className='dow'; e.textContent=d; grid.appendChild(e); });

    const firstWeekday=new Date(y,m,1).getDay();
    const total=getMonthDays(y,m);

    for(let i=0;i<firstWeekday;i++){
      const empty=document.createElement('div'); grid.appendChild(empty);
    }

    for(let d=1;d<=total;d++){
      const date=new Date(y,m,d);
      const dateStr=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayDiv=document.createElement('div');dayDiv.className='day';
      if(now.getFullYear()===y && now.getMonth()===m && now.getDate()===d) dayDiv.classList.add('today');
      // 如果该日期已有任意来源（日记对象 / 本地 / 文件）日记内容则加提示点
      try {
        const hasLocal = (DiaryStore.load(dateStr)||'').trim();
        const hasStatic = PublicDiary.getDiary(dateStr).trim();
        const hasFile = PublicDiary.hasFileDiary ? PublicDiary.hasFileDiary(dateStr) : false;
        if(hasLocal || hasStatic || hasFile) dayDiv.classList.add('has-note');
      } catch(e){}
      const g=document.createElement('div');g.className='g';g.textContent=d;
      const label = LunarCalendar.composeLunarLabel(date);
      const lunarDiv=document.createElement('div');lunarDiv.className='lunar';lunarDiv.textContent=label;
      // Badge 分类
      if(['春节','中秋节','端午节','元宵节','除夕','国庆节'].includes(label)){
        const b=document.createElement('div');b.className='badge festival';b.textContent=label.replace('节','');dayDiv.appendChild(b);
      }else if(LunarCalendar.getSolarTerm(date)===label){
        const b=document.createElement('div');b.className='badge term';b.textContent=label;dayDiv.appendChild(b);
      } else if(['元旦','劳动节'].includes(label)){
        const b=document.createElement('div');b.className='badge holiday';b.textContent=label;dayDiv.appendChild(b);
      }
      dayDiv.append(g,lunarDiv);
      dayDiv.addEventListener('click',()=>{
        if(!CAN_EDIT){
          const hasLocal = (DiaryStore.load(dateStr)||'').trim();
          const hasStatic = PublicDiary.getDiary(dateStr).trim();
          const hasFile = PublicDiary.hasFileDiary ? PublicDiary.hasFileDiary(dateStr) : false;
            if(!(hasLocal || hasStatic || hasFile)) return; // 无内容则不弹窗
        }
        openDiary(date,dateStr,label);
      });
      grid.appendChild(dayDiv);
    }
    container.appendChild(grid);

    // 说明 Legend
    const legend=document.createElement('div');legend.className='legend';
    legend.innerHTML='<span><i class="i-festival"></i>传统节日</span><span><i class="i-term"></i>节气</span><span><i class="i-holiday"></i>公历节日</span><span><i class="i-today"></i>今天</span>';
    container.appendChild(legend);

    // 使用当前正在浏览的月份来决定背景（取该月中旬 15 日避免跨月干扰）
    const midDate = new Date(y, m, 15);
    BackgroundManager.updateBackgroundFor(midDate);
    // 触发季节音乐（需要用户已交互才会真正播放，由 music.js 内部判断）
    if(window.BGM && typeof window.BGM.playSeasonFor==='function'){
      window.BGM.playSeasonFor(midDate);
    }
  }

  // Diary Modal
  const modal=document.getElementById('diary-modal');
  const closeBtn=document.getElementById('close-modal');
  const diaryText=document.getElementById('diary-text');
  const modalDate=document.getElementById('modal-date');
  const modalLunar=document.getElementById('modal-lunar');
  const saveBtn=document.getElementById('save-diary');
  const delBtn=document.getElementById('delete-diary');
  let activeDateStr=null;

  function openDiary(date,dateStr,label){
    activeDateStr=dateStr;
    modalDate.textContent=dateStr + (CAN_EDIT? ' (编辑模式)' : '');
    modalLunar.textContent=`农历：${label}`;
    let initial = (DiaryStore.load(dateStr) || PublicDiary.getDiary(dateStr) || '');
    diaryText.value = initial;
    // 若本地无 & 静态对象无，尝试异步加载文件
    if(!initial.trim() && PublicDiary.fetchDiaryFile){
      diaryText.value='(加载中...)';
      PublicDiary.fetchDiaryFile(dateStr).then(txt=>{
        if(activeDateStr!==dateStr) return; // 用户可能已关闭
        if(!CAN_EDIT){
          diaryText.value = txt || '';
        } else {
          // 编辑模式下不覆盖用户可能已经开始输入的内容
          if(diaryText.value==='(加载中...)') diaryText.value = txt || '';
        }
      });
    }
    if(CAN_EDIT){
      diaryText.removeAttribute('disabled');
      saveBtn.style.display='';
      delBtn.style.display='';
    } else {
      diaryText.setAttribute('disabled','disabled');
      saveBtn.style.display='none';
      delBtn.style.display='none';
    }
    modal.classList.remove('hidden');
    // 根据具体日期尝试切换该日期对应季节的音乐
    if(window.BGM && typeof window.BGM.playSeasonFor==='function'){
      window.BGM.playSeasonFor(date);
    }
    if(CAN_EDIT) setTimeout(()=>{diaryText.focus();},80);
  }
  function closeDiary(){modal.classList.add('hidden');activeDateStr=null;}
  closeBtn.addEventListener('click',closeDiary);
  modal.addEventListener('click',e=>{if(e.target===modal) closeDiary();});
  saveBtn.addEventListener('click',()=>{ 
    if(!CAN_EDIT) return; if(!activeDateStr) return; 
    const val = diaryText.value.trim();
    DiaryStore.save(activeDateStr,val); 
    // 若绑定了目录则写入对应 txt
    if(window.FileDiarySync && typeof window.FileDiarySync.onSave==='function'){
      window.FileDiarySync.onSave(activeDateStr,val);
    }
    closeDiary(); render(); 
  });
  delBtn.addEventListener('click',()=>{ 
    if(!CAN_EDIT) return; if(!activeDateStr) return; 
    if(confirm('确定删除该日记?')){
      DiaryStore.save(activeDateStr,''); 
      if(window.FileDiarySync && typeof window.FileDiarySync.onSave==='function'){
        window.FileDiarySync.onSave(activeDateStr,'');
      }
      closeDiary(); render();
    }
  });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape' && !modal.classList.contains('hidden')) closeDiary(); });

  render();
})();
