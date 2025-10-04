// diaries.js - 公共只读日记数据
// 用途: 部署到 GitHub Pages / Cloudflare Pages 后，所有 PUBLIC_DIARIES 中的日期在日历上点击即可阅读，但不能在线编辑。
// 本地开发 (localhost / 127.0.0.1 / file://) 仍然允许编辑，编辑内容只存储到 localStorage；需要公开时再手动把导出的 JSON 写回本文件提交。
// 导出方法: 在本地浏览器控制台执行 window.__exportLocalDiaries()，得到合并后的 JSON，复制覆盖 PUBLIC_DIARIES 后 git 提交。
(function(global){
  // 在这里填入你想“预置并公开展示（只读）”的日记。
  // 格式: 'YYYY-MM-DD': '内容字符串'。
  // 可先本地写 -> 导出 -> 粘贴回来。
  const PUBLIC_DIARIES = {
    // 示例：
    // '2025-10-01': '国庆假期第一天，天气晴，完成了背景音乐的重构。',
    // '2025-10-02': '实现了日记只读 / 本地可编辑的逻辑。',
  };

  // 本地开发环境判定（允许编辑）
  const IS_LOCAL = ['localhost','127.0.0.1','::1'].includes(location.hostname)
                   || location.origin.startsWith('file://');
  function hasEditPrivilege(){
    return IS_LOCAL; // 线上一律只读，不再用 #edit hash
  }

  function getDiary(dateStr){
    // 优先本地覆盖（仅你自己的浏览器）
    try {
      const local = localStorage.getItem('memories-diary-'+dateStr);
      if(local) return local;
    }catch(e){}
    return PUBLIC_DIARIES[dateStr]||'';
  }

  function isPublicHas(dateStr){ return PUBLIC_DIARIES.hasOwnProperty(dateStr); }

  function exportLocal(){
    const out={...PUBLIC_DIARIES};
    for(const k in localStorage){
      if(k.startsWith('memories-diary-')){
        const date=k.replace('memories-diary-','');
        const val=localStorage.getItem(k);
        if(val) out[date]=val;
      }
    }
    const json=JSON.stringify(out,null,2);
    console.log('复制以下 JSON 覆盖 diaries.js 中 PUBLIC_DIARIES:\n', json);
    return json;
  }

  global.PublicDiary = {getDiary,isPublicHas,hasEditPrivilege};
  global.__exportLocalDiaries = exportLocal;
})(window);
