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

  // 本地一键下载合并后的 diaries.js，方便直接覆盖仓库文件再提交
  function downloadMergedFile(){
    const mergedJSON = exportLocal();
    const fileContent = `// diaries.js - 公共只读日记数据 (自动生成)\n`+
`(function(global){\n`+
`  const PUBLIC_DIARIES = ${mergedJSON};\n\n`+
`  const IS_LOCAL = ['localhost','127.0.0.1','::1'].includes(location.hostname) || location.origin.startsWith('file://');\n`+
`  function hasEditPrivilege(){ return IS_LOCAL; }\n`+
`  function getDiary(dateStr){\n`+
`    try { const local = localStorage.getItem('memories-diary-'+dateStr); if(local) return local; } catch(e){}\n`+
`    return PUBLIC_DIARIES[dateStr]||'';\n`+
`  }\n`+
`  function isPublicHas(dateStr){ return PUBLIC_DIARIES.hasOwnProperty(dateStr); }\n`+
`  function exportLocal(){ return JSON.stringify(PUBLIC_DIARIES,null,2); }\n`+
`  global.PublicDiary = {getDiary,isPublicHas,hasEditPrivilege};\n`+
`  global.__exportLocalDiaries = exportLocal;\n`+
`})(window);\n`;
    const blob = new Blob([fileContent], {type:'application/javascript;charset=utf-8'});
    const a=document.createElement('a');
    a.download='diaries.js';
    a.href=URL.createObjectURL(blob);
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  // 若本地开发，插入导出按钮
  if(['localhost','127.0.0.1','::1'].includes(location.hostname) || location.origin.startsWith('file://')){
    window.addEventListener('DOMContentLoaded', ()=>{
      const btn=document.createElement('button');
      btn.textContent='导出日记文件';
      btn.style.cssText='position:fixed;bottom:8px;right:8px;z-index:9999;background:#ec4899;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,.2)';
      btn.title='生成并下载包含所有公共+本地修改的 diaries.js 文件';
      btn.onclick=downloadMergedFile;
      document.body.appendChild(btn);
    });
  }

  global.PublicDiary = {getDiary,isPublicHas,hasEditPrivilege};
  global.__exportLocalDiaries = exportLocal;
})(window);
