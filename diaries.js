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

  // 尝试从静态文件 (diaries/YYYY-MM-DD.txt) 读取公开日记（异步）。
  // 返回 Promise<string>，找不到时 resolve ''，并缓存结果避免重复请求。
  const __fileCache = {};
  const FILE_DIARY_DATES = new Set();
  let manifestPromise = null;
  function loadDiaryManifest(){
    if(manifestPromise) return manifestPromise;
    manifestPromise = fetch('diaries/manifest.json',{cache:'no-cache'})
      .then(r=> r.ok ? r.json() : [])
      .then(arr=>{ if(Array.isArray(arr)) arr.forEach(d=>FILE_DIARY_DATES.add(d)); return FILE_DIARY_DATES; })
      .catch(()=>FILE_DIARY_DATES);
    return manifestPromise;
  }
  function hasFileDiary(dateStr){ return FILE_DIARY_DATES.has(dateStr); }
  function fetchDiaryFile(dateStr){
    if(__fileCache[dateStr] !== undefined){
      return Promise.resolve(__fileCache[dateStr]);
    }
    const url = `diaries/${dateStr}.txt`;
    return fetch(url,{cache:'no-cache'})
      .then(r=>{ if(!r.ok) return ''; return r.text(); })
      .then(text=>{ const t = text.trim(); if(t) __fileCache[dateStr]=t; else __fileCache[dateStr]=''; return __fileCache[dateStr]; })
      .catch(()=>{ __fileCache[dateStr]=''; return ''; });
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

      // 简化策略：不做自动写入本地目录，只提供“保存时自动下载该日期TXT”辅助你手动放入 diaries/ 并提交。
      // 提供全局函数，calendar.js 保存后调用。
      global.__downloadDiaryTxt = function(dateStr, content){
        const blob = new Blob([content.replace(/\r?\n/g,'\n')+'\n'], {type:'text/plain;charset=utf-8'});
        const a=document.createElement('a');
        a.download = dateStr + '.txt';
        a.href = URL.createObjectURL(blob);
        a.style.display='none';
        document.body.appendChild(a); a.click();
        setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      };

      // 自动本地写入版本改进：提供绑定按钮+状态提示；优先写入 diaries/ 子目录
      (function(){
        if(!('showDirectoryPicker' in window)){
          console.info('[diaries] 浏览器不支持 showDirectoryPicker，使用下载方式。');
          return;
        }
        let diariesDirHandle = null; // 指向真正的 diaries 目录
        let rootPicked = false;

        // UI 元素
        const bindBtn = document.createElement('button');
        bindBtn.textContent='绑定 diaries 目录';
        bindBtn.style.cssText='position:fixed;bottom:8px;left:8px;z-index:9999;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,.25)';
        const statusTag = document.createElement('span');
        statusTag.style.cssText='position:fixed;bottom:44px;left:12px;z-index:9999;font-size:11px;color:#888;background:rgba(0,0,0,.4);padding:2px 6px;border-radius:4px;backdrop-filter:blur(4px);';
        statusTag.textContent='未绑定';
        document.body.appendChild(bindBtn);
        document.body.appendChild(statusTag);

        function toast(msg, ok){
          let t=document.createElement('div');
          t.textContent=msg;
          t.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:'+(ok?'#16a34a':'#dc2626')+';color:#fff;padding:6px 12px;border-radius:6px;font-size:12px;z-index:10000;box-shadow:0 2px 6px rgba(0,0,0,.35);';
          document.body.appendChild(t); setTimeout(()=>{t.style.opacity='0'; t.style.transition='opacity .4s';},20); setTimeout(()=>t.remove(),1800);
        }

        async function pick(){
          try {
            const handle = await window.showDirectoryPicker({id:'memories-root-or-diaries'});
            rootPicked=true;
            // 尝试进入 diaries 子目录，如果该目录本身已经是 diaries，进入失败就保持当前
            try {
              const sub = await handle.getDirectoryHandle('diaries');
              diariesDirHandle = sub; // 用户选的是仓库根
            } catch(_){
              // 没有 diaries 子目录，可能用户直接选的 diaries 目录，检测一个典型 txt 是否存在
              diariesDirHandle = handle;
            }
            statusTag.textContent='已绑定';
            statusTag.style.color='#16a34a';
            toast('已绑定目录', true);
          } catch(e){
            console.warn('目录选择被取消', e);
            toast('未绑定，使用自动下载', false);
          }
        }

        bindBtn.addEventListener('click', pick);

        async function ensureDiaries(){
          if(diariesDirHandle) return true;
          await pick();
          return !!diariesDirHandle;
        }

        async function writeFile(dateStr, content){
          const ok = await ensureDiaries();
          if(!ok){
            if(global.__downloadDiaryTxt) global.__downloadDiaryTxt(dateStr, content);
            return;
          }
          try {
            if(!content.trim()){
              try { await diariesDirHandle.removeEntry(dateStr+'.txt'); toast('已删除 '+dateStr+'.txt', true);} catch(_){ toast('本地无此文件', false); }
              return;
            }
            const fh = await diariesDirHandle.getFileHandle(dateStr+'.txt',{create:true});
            const w = await fh.createWritable();
            await w.write(content.replace(/\r?\n/g,'\n')+'\n');
            await w.close();
            toast('写入成功 '+dateStr+'.txt', true);
            // 立即更新内存集合，便于当月提示点刷新（若页面重新渲染）
            try { FILE_DIARY_DATES.add(dateStr); } catch(_){}
            document.dispatchEvent(new CustomEvent('diary-file-written',{detail:{date:dateStr}}));
          } catch(err){
            console.warn('写入失败，回退下载', err);
            toast('写入失败，改为下载', false);
            if(global.__downloadDiaryTxt) global.__downloadDiaryTxt(dateStr, content);
          }
        }
        global.FileDiaryAutoWriter = { save: writeFile, rebind: pick };
      })();
    });
  }

  global.PublicDiary = {getDiary,isPublicHas,hasEditPrivilege,fetchDiaryFile,loadDiaryManifest,hasFileDiary};
  global.__exportLocalDiaries = exportLocal;
})(window);
