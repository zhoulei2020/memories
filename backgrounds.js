// backgrounds.js - 四季 / 节气 / 节日 背景与特效
(function(){
  // ======================= 粒子层（与季节联动） =======================
  const seasonCanvas = document.getElementById('season-canvas');
  const ctx = seasonCanvas.getContext('2d');
  function resize(){seasonCanvas.width=window.innerWidth;seasonCanvas.height=window.innerHeight;} window.addEventListener('resize',resize);resize();
  const particles=[];
  function spawn(type){
    const w=seasonCanvas.width,h=seasonCanvas.height;
    const p={x:Math.random()*w,y:Math.random()*h,vx:0,vy:0,size:0.5+Math.random()*2,rot:Math.random()*Math.PI*2,type};
    switch(type){
      case 'spring': p.vx=-0.3+Math.random()*0.6;p.vy=0.4+Math.random()*0.8;p.size=4+Math.random()*6;break;
      case 'summer': p.vx=-0.15+Math.random()*0.3;p.vy=0.2+Math.random()*0.4;p.size=2+Math.random()*3;break;
      case 'autumn': p.vx=-0.4+Math.random()*0.8;p.vy=0.6+Math.random()*1;p.size=5+Math.random()*8;break;
      case 'winter': p.vx=-0.2+Math.random()*0.4;p.vy=0.4+Math.random()*0.9;p.size=3+Math.random()*5;break;
    }
    particles.push(p);
  }
  function drawParticle(p){
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);let g;
    switch(p.type){
      case 'spring': g=ctx.createRadialGradient(0,0,0,0,0,p.size);g.addColorStop(0,'rgba(255,182,193,.95)');g.addColorStop(1,'rgba(255,182,193,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,p.size,0,Math.PI*2);ctx.fill();break;
      case 'summer': ctx.fillStyle='rgba(255,255,200,.75)';ctx.beginPath();ctx.arc(0,0,p.size,0,Math.PI*2);ctx.fill();break;
      case 'autumn': ctx.fillStyle='rgba(255,165,0,.70)';ctx.beginPath();ctx.moveTo(-p.size,0);ctx.lineTo(0,-p.size*1.2);ctx.lineTo(p.size,0);ctx.lineTo(0,p.size*1.2);ctx.closePath();ctx.fill();break;
      case 'winter': ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.arc(0,0,p.size,0,Math.PI*2);ctx.fill();break;
    }
    ctx.restore();
  }
  function loop(){
    ctx.clearRect(0,0,seasonCanvas.width,seasonCanvas.height);
    const type=document.body.dataset.particleType;
    if(type){ for(let i=0;i<3;i++) if(particles.length<220) spawn(type); }
    particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.rot+=0.01;});
    for(let i=particles.length-1;i>=0;i--){const p=particles[i]; if(p.y>seasonCanvas.height+40||p.x<-60||p.x>seasonCanvas.width+60) particles.splice(i,1);}
    particles.forEach(drawParticle); requestAnimationFrame(loop);
  } loop();

  // ======================= 背景图片配置（多层级优先级：日期 > 节气 > 节日 > 月份 > 季节） =======================
  // 请把实际图片放入 assets/ 下；可使用 WebP 以减小体积。文件名仅示例。
  // 你可以补充或替换：
  // 1) DATE_IMAGES: 特定公历日期 (MM-DD)
  // 2) TERM_IMAGES: 节气
  // 3) FESTIVAL_IMAGES: 传统/公历节日
  // 4) MONTH_IMAGES: 各月代表图
  // 5) SEASON_IMAGES: 季节兜底

  const DATE_IMAGES = {
    '02-14': ['assets/date/0214_valentine.jpg'],
    '12-31': ['assets/date/1231_newyear_eve.jpg']
  };

  const TERM_IMAGES = {
    '立春': ['assets/term/lichun.jpg'],
    '雨水': ['assets/term/yushui.jpg'],
    '惊蛰': ['assets/term/jingzhe.jpg'],
    '春分': ['assets/term/chunfen.jpg'],
    '清明': ['assets/term/qingming.jpg'],
    '谷雨': ['assets/term/guyu.jpg'],
    '立夏': ['assets/term/lixia.jpg'],
    '小满': ['assets/term/xiaoman.jpg'],
    '芒种': ['assets/term/mangzhong.jpg'],
    '夏至': ['assets/term/xiazhi.jpg'],
    '立秋': ['assets/term/liqiu.jpg'],
    '白露': ['assets/term/bailu.jpg'],
    '秋分': ['assets/term/qiufen.jpg'],
    '寒露': ['assets/term/hanlu.jpg'],
    '霜降': ['assets/term/shuangjiang.jpg'],
    '立冬': ['assets/term/lidong.jpg'],
    '冬至': ['assets/term/dongzhi.jpg']
  };

  const FESTIVAL_IMAGES = {
    '春节': ['assets/festival/spring.jpg'],
    '元宵节': ['assets/festival/lantern.jpg'],
    '端午节': ['assets/festival/dragonboat.jpg'],
    '中秋节': ['assets/festival/midautumn.jpg'],
    '国庆节': ['assets/festival/nationalday.jpg'],
    '除夕': ['assets/festival/chuxi.jpg']
  };

  const MONTH_IMAGES = {
    '01': ['assets/month/01_winter_sunrise.jpg'],
    '02': ['assets/month/02_plum.jpg'],
    '03': ['assets/month/03_blossom.jpg'],
    '04': ['assets/month/04_sakura.jpg'],
    '05': ['assets/month/05_green_fields.jpg'],
    '06': ['assets/month/06_lotus.jpg'],
    '07': ['assets/month/07_sea.jpg'],
    '08': ['assets/month/08_starry_summer.jpg'],
    '09': ['assets/month/09_autumn_leaves.jpg'],
    '10': ['assets/month/10_harvest.jpg'],
    '11': ['assets/month/11_fog.jpg'],
    '12': ['assets/month/12_snow.jpg']
  };

  const SEASON_IMAGES = {
    spring: ['assets/season/spring1.jpg','assets/season/spring2.jpg'],
    summer: ['assets/season/summer1.jpg','assets/season/summer2.jpg'],
    autumn: ['assets/season/autumn1.jpg','assets/season/autumn2.jpg'],
    winter: ['assets/season/winter1.jpg','assets/season/winter2.jpg']
  };

  // 特殊节假日 / 节气可单独指定图片（优先级高于季节）
  const SPECIAL_BG = { // 保留类效果（可与 FESTIVAL_IMAGES 联用）
    '春节': {class:'festival-spring'},
    '元宵节': {class:'festival-spring'},
    '中秋节': {class:'festival-moon'},
    '国庆节': {class:'festival-national'},
    '端午节': {class:'festival-dragon'},
    '除夕': {class:'festival-spring'},
    '清明': {class:'term-qingming'}
  };

  let lastSeason=null; // 防止同季节重复随机
  let lastAppliedSpecial=null;
  const bgLayer=document.getElementById('background-layer');

  function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
  function computeSeason(date){
    const m=date.getMonth()+1;
    if([3,4,5].includes(m)) return 'spring';
    if([6,7,8].includes(m)) return 'summer';
    if([9,10,11].includes(m)) return 'autumn';
    return 'winter';
  }

  function setSeason(season){
    if(lastSeason!==season){
      document.body.classList.remove('spring','summer','autumn','winter');
      document.body.classList.add(season);
      document.body.dataset.particleType=season;
      // 选择图片
      const list=SEASON_IMAGES[season]||[];
      if(list.length){
        const img=pick(list);
        preloadAndFade(img);
      } else {
        // 使用 CSS 的默认渐变（由 body class 控制）
        bgLayer.style.backgroundImage='';
      }
      lastSeason=season;
    }
  }

  function applySpecialClass(label){
    if(lastAppliedSpecial && lastAppliedSpecial!==label){
      const prev=SPECIAL_BG[lastAppliedSpecial];
      if(prev && prev.class) document.body.classList.remove(prev.class);
      lastAppliedSpecial=null;
    }
    const info=SPECIAL_BG[label];
    if(info){
      if(info.class) document.body.classList.add(info.class);
      lastAppliedSpecial=label;
    }
  }

  function chooseImage(date){
    const y=date.getFullYear();
    const m=(date.getMonth()+1).toString().padStart(2,'0');
    const d=date.getDate().toString().padStart(2,'0');
    const mmdd=`${m}-${d}`;
    const term=LunarCalendar.getSolarTerm(date);
    const label=LunarCalendar.composeLunarLabel(date); // 可能返回节日/节气/农历

    // 1) 日期定制
    if(DATE_IMAGES[mmdd] && DATE_IMAGES[mmdd].length) return pick(DATE_IMAGES[mmdd]);
    // 2) 节气图片精确匹配 term
    if(term && TERM_IMAGES[term] && TERM_IMAGES[term].length) return pick(TERM_IMAGES[term]);
    // 3) 节日（优先 FESTIVAL_IMAGES）
    if(FESTIVAL_IMAGES[label] && FESTIVAL_IMAGES[label].length) return pick(FESTIVAL_IMAGES[label]);
    // 4) 月份
    if(MONTH_IMAGES[m] && MONTH_IMAGES[m].length) return pick(MONTH_IMAGES[m]);
    // 5) 季节兜底
    return null; // 由季节函数补充
  }

  function updateBackgroundFor(date){
    const season=computeSeason(date);
    setSeason(season);
    const label=LunarCalendar.composeLunarLabel(date);
    applySpecialClass(label);
    const chosen=chooseImage(date);
    if(chosen){
      preloadAndFade(chosen);
    } else {
      // 没有更具体的就让季节背景生效 (若季节已设置图片则不再强制)
      if(!bgLayer.style.backgroundImage) {
        const list=SEASON_IMAGES[lastSeason]||[]; if(list.length) preloadAndFade(pick(list));
      }
    }
    applyNightMode();
  }

  // ========== 背景预加载 + 淡入 ==========
  function preloadAndFade(src){
    const img=new Image();
    img.onload=()=>{
      bgLayer.style.opacity=0;
      requestAnimationFrame(()=>{
        // 下一帧替换背景再淡入
        bgLayer.style.backgroundImage=`url('${src}')`;
        bgLayer.style.backgroundSize='cover';
        bgLayer.style.backgroundPosition='center';
        requestAnimationFrame(()=>{bgLayer.style.opacity=1;});
      });
    };
    img.src=src;
  }

  // ========== 夜间模式 (18:00~05:59) ===========
  function applyNightMode(){
    const hour=new Date().getHours();
    if(hour>=18 || hour<6) document.body.classList.add('night');
    else document.body.classList.remove('night');
  }
  setInterval(applyNightMode, 5*60*1000);

  window.BackgroundManager={updateBackgroundFor,applyNightMode};
})();
