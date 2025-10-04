// storage.js - 简易本地存储封装
(function(global){
  const KEY_PREFIX='memories-diary-';
  function save(dateStr,text){
    if(!text) {localStorage.removeItem(KEY_PREFIX+dateStr);return;}
    localStorage.setItem(KEY_PREFIX+dateStr,text);
  }
  function load(dateStr){
    return localStorage.getItem(KEY_PREFIX+dateStr)||'';
  }
  function listAll(){
    return Object.keys(localStorage).filter(k=>k.startsWith(KEY_PREFIX)).map(k=>({date:k.replace(KEY_PREFIX,''),text:localStorage.getItem(k)}));
  }
  global.DiaryStore={save,load,listAll};
})(window);
