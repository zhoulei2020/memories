// diaries.js (TSV SINGLE FILE MODE) - 简化：所有公开日记集中存放在 total_diary.tsv
// 站点加载时读取 total_diary.tsv -> 填充 PUBLIC_DIARIES
// 本地编辑“保存”时：调用 saveDiary -> 更新内存 -> 自动下载新的 total_diary.tsv (手动覆盖仓库文件即可)
// TSV 行格式: YYYY-MM-DD<TAB>内容(内容内部换行以 \n 存储)
(function(global){
  const PUBLIC_DIARIES = {}; // 运行时填充
  const IS_LOCAL = ['localhost','127.0.0.1','::1'].includes(location.hostname) || location.origin.startsWith('file://');
  function hasEditPrivilege(){ return IS_LOCAL; }

  // 解析 TSV
  function parseTSV(text){
    text.split(/\r?\n/).forEach(line=>{
      if(!line.trim() || line.startsWith('#')) return;
      const idx=line.indexOf('\t');
      if(idx<0) return;
      const date=line.slice(0,idx).trim();
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      const raw=line.slice(idx+1);
      const body=raw.replace(/\\n/g,'\n');
      if(!PUBLIC_DIARIES[date]) PUBLIC_DIARIES[date]=body; // 不覆盖后续本地保存
    });
  }
  fetch('total_diary.tsv',{cache:'no-cache'}).then(r=> r.ok? r.text():'' ).then(parseTSV).catch(()=>{});

  function getDiary(dateStr){
    try{ const local=localStorage.getItem('memories-diary-'+dateStr); if(local) return local; }catch(e){}
    return PUBLIC_DIARIES[dateStr]||'';
  }
  function isPublicHas(dateStr){ return Object.prototype.hasOwnProperty.call(PUBLIC_DIARIES,dateStr); }

  // 导出 TSV（合并本地覆盖）
  function buildTSV(){
    const map={...PUBLIC_DIARIES};
    try{
      for(const k in localStorage){
        if(k.startsWith('memories-diary-')){
          const d=k.replace('memories-diary-','');
            const v=localStorage.getItem(k); if(v) map[d]=v;
        }
      }
    }catch(e){}
    const lines=[
      '# total_diary.tsv',
      '# 生成时间: '+new Date().toISOString(),
      '# 格式: 日期\t内容(换行转义为 \\n)'
    ];
    Object.keys(map).sort().forEach(d=>{
      const body=(map[d]||'').replace(/\r?\n/g,'\\n').replace(/\t/g,'  ');
      lines.push(d+'\t'+body);
    });
    return lines.join('\n')+'\n';
  }
  function downloadTSV(){
    const blob=new Blob([buildTSV()],{type:'text/tab-separated-values;charset=utf-8'});
    const a=document.createElement('a');
    a.download='total_diary.tsv';
    a.href=URL.createObjectURL(blob);
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function saveDiary(dateStr, content){
    if(!dateStr) return;
    if(content && content.trim()) PUBLIC_DIARIES[dateStr]=content.trim(); else delete PUBLIC_DIARIES[dateStr];
    downloadTSV();
  }

  function exportLocal(){ return JSON.stringify(PUBLIC_DIARIES,null,2); }
  function downloadMergedFile(){ // 保留旧按钮逻辑：导出 diaries.js 形式
    const json=exportLocal();
    const fileContent=`// diaries.js (exported)\n(function(g){const PUBLIC_DIARIES=${json};g.PublicDiary={getDiary:(d)=>PUBLIC_DIARIES[d]||''};})(window);\n`;
    const blob=new Blob([fileContent],{type:'application/javascript;charset=utf-8'});
    const a=document.createElement('a');a.download='diaries.js';a.href=URL.createObjectURL(blob);document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);
  }

  // 兼容旧接口（不再使用单文件 per-date txt / manifest）
  function fetchDiaryFile(){ return Promise.resolve(''); }
  function loadDiaryManifest(){ return Promise.resolve(new Set()); }
  function hasFileDiary(){ return false; }

  if(IS_LOCAL){
    window.addEventListener('DOMContentLoaded',()=>{
      const tsvBtn=document.createElement('button');
      tsvBtn.textContent='导出 TSV';
      tsvBtn.style.cssText='position:fixed;bottom:8px;right:8px;z-index:9999;background:#0d9488;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,.25)';
      tsvBtn.onclick=downloadTSV;document.body.appendChild(tsvBtn);
    });
  }

  global.PublicDiary={getDiary,isPublicHas,hasEditPrivilege,fetchDiaryFile,loadDiaryManifest,hasFileDiary,saveDiary};
  global.__exportTSV=downloadTSV;
})(window);
