// diaries.js - 公共只读日记 (部署到 Gitee 后访客可看到的内容)
// 说明: 这里的内容是静态公开的，你可以手动编辑再提交。
// 访客默认无编辑权限；你本人在本地访问时加上 #edit 进入编辑模式（仅写入 localStorage，不会自动提交到仓库）。
// 想把本地写的新日记同步到这个文件：打开控制台运行 window.__exportLocalDiaries() 复制结果替换下面对象再提交。
(function(global){
  const PUBLIC_DIARIES = {
    // 示例: '2025-01-01': '跨年的一点心情……'
  };

  const EDIT_MODE = location.hash.includes('edit');
  function hasEditPrivilege(){
    if(EDIT_MODE){
      try { localStorage.setItem('memories-edit-mode','1'); } catch(e){}
      return true;
    }
    return localStorage.getItem('memories-edit-mode')==='1' && EDIT_MODE; // 只有再次带 hash 才启用
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
