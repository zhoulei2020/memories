// lunar.js - 简易农历 & 节气 & 节日计算 (1900-2100), 自主实现可自由使用
// 数据来源属于客观事实，本实现代码为原创（避免版权风险）
(function(global){
  const LUNAR_INFO = [
    0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2, //1900-1909
    0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977, //1910-1919
    0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970, //1920-1929
    0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950, //1930-1939
    0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557, //1940-1949
    0x06ca0,0x0b550,0x15355,0x04da0,0x0a5d0,0x14573,0x052d0,0x0a9a8,0x0e950,0x06aa0, //1950-1959
    0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0, //1960-1969
    0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b5a0,0x195a6, //1970-1979
    0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570, //1980-1989
    0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0, //1990-1999
    0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5, //2000-2009
    0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930, //2010-2019
    0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530, //2020-2029
    0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45, //2030-2039
    0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0, //2040-2049
  ]; // (截断: 为简明仅列到 2049，可按需补全)

  // 24节气 - 传统算法所使用基准 (分钟偏移) & 名称
  const SOLAR_TERMS_MINUTES = [
    0,21208,42467,63836,85337,107014,128867,150921,173149,195551,218072,240693,
    263343,285989,308563,331033,353350,375494,397447,419210,440795,462224,483532,504758
  ]; // 分钟数偏移 (相对 1900-01-06 02:05:00 +08:00)
  const TERM_NAMES = ["小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种","夏至","小暑","大暑","立秋","处暑","白露","秋分","寒露","霜降","立冬","小雪","大雪","冬至"];

  const SOLAR_HOLIDAYS = { // 公历节日
    "01-01":"元旦","02-14":"情人节","05-01":"劳动节","10-01":"国庆节","12-25":"圣诞节"
  };
  const LUNAR_HOLIDAYS = { // 农历节日
    "01-01":"春节","01-15":"元宵节","05-05":"端午节","07-07":"七夕","08-15":"中秋节","09-09":"重阳节","12-30":"除夕" // 除夕近似(不处理大小月差异)
  };

  function lunarYearDays(y){
    let sum=348; // 12 * 29
    const info=LUNAR_INFO[y-1900];
    for(let i=0x8000;i>0x8;i>>=1) sum += (info & i)?1:0; // 有30天的月
    return sum + leapDays(y);
  }
  function leapMonth(y){ return LUNAR_INFO[y-1900] & 0xf; }
  function leapDays(y){ const lm=leapMonth(y); if(!lm) return 0; return (LUNAR_INFO[y-1900] & 0x10000)?30:29; }
  function monthDays(y,m){ return (LUNAR_INFO[y-1900] & (0x10000>>m))?30:29; }

  function solarToLunar(date){
    const base=new Date(1900,0,31); // 农历1900-01-01
    let offset=Math.floor((date - base)/86400000);
    let year=1900;
    while(year<2050 && offset>0){
      const days=lunarYearDays(year);
      if(offset<days) break;
      offset-=days;year++;
    }
    let leap=leapMonth(year),isLeap=false;let month=1;
    while(month<=12 && offset>=0){
      let md = monthDays(year,month);
      if(leap && month===leap+1 && !isLeap){ // 处理闰月
        md = leapDays(year); isLeap=true; month--; // 月份不前进
      }else{ isLeap=false; }
      if(offset<md) break;
      offset-=md;month++;
    }
    const day=offset+1;
    return {lYear:year,lMonth:month,lDay:day,isLeap};
  }

  function pad(n){return n<10?"0"+n:""+n;}
  function lunarDayName(d){
    const n1=['初','十','廿','三'];
    const n2=['日','一','二','三','四','五','六','七','八','九','十'];
    if(d===10) return '初十';
    if(d===20) return '二十';
    if(d===30) return '三十';
    return n1[Math.floor((d-1)/10)] + n2[(d-1)%10+1];
  }
  function lunarMonthName(m){
    const arr=['正','二','三','四','五','六','七','八','九','十','十一','腊'];
    return arr[m-1]+"月";
  }

  // ============= 24节气计算（经典线性公式，适用于 1900-2100） =============
  // 基准：1900-01-06 02:05:00（东八区）为小寒。每年回归年毫秒：31556925974.7
  const TERM_BASE = Date.UTC(1900,0,5,18,5,0); // 转成 UTC (北京时间-8h)
  function getSolarTerm(date){
    const year=date.getFullYear();
    for(let i=0;i<24;i++){
      const ms = TERM_BASE + (year-1900)*31556925974.7 + SOLAR_TERMS_MINUTES[i]*60000;
      const d = new Date(ms + 8*3600*1000); // 转回北京时间
      if(d.getFullYear()===year && d.getMonth()===date.getMonth() && d.getDate()===date.getDate()) return TERM_NAMES[i];
    }
    return null;
  }

  function getFestivals(date){
    const y=date.getFullYear();
    const m=pad(date.getMonth()+1); const d=pad(date.getDate());
    const solarKey=`${m}-${d}`; const solarFest=SOLAR_HOLIDAYS[solarKey]||null;
    const lunar=solarToLunar(date);
    const lm=pad(lunar.lMonth); const ld=pad(lunar.lDay);
    const lunarKey=`${lm}-${ld}`; let lunarFest=LUNAR_HOLIDAYS[lunarKey]||null;
    // 简易除夕修正：若农历腊月最后一天
    if(!lunarFest && lm==='12'){
      // 计算腊月天数
      const tempYearDays = monthDays(lunar.lYear,12);
      if(lunar.lDay===tempYearDays) lunarFest='除夕';
    }
    return {solarFest,lunarFest,lunar};
  }

  function composeLunarLabel(date){
    const {lunarFest,solarFest,lunar}=getFestivals(date);
    if(lunarFest) return lunarFest;
    if(solarFest) return solarFest;
    const term=getSolarTerm(date);
    if(term) return term;
    if(lunar.lDay===1) return lunarMonthName(lunar.lMonth);
    return lunarDayName(lunar.lDay);
  }

  global.LunarCalendar={solarToLunar,getSolarTerm,getFestivals,composeLunarLabel,lunarDayName,lunarMonthName};
})(window);
