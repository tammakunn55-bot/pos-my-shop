
(function(){
'use strict';
var tip=document.createElement('div'); tip.id='hb-tip'; tip.setAttribute('role','status'); document.body.appendChild(tip);
var T=null, $=function(id){return document.getElementById(id);};
var txt=function(id){var e=$(id);return e?String(e.textContent||'').trim():'';};
var shown=function(id){var e=$(id);return !!e&&!e.classList.contains('hidden')&&e.style.display!=='none';};
var TIPS={
  settings:function(){return '⚙️ ศูนย์การตั้งค่า';},
  shift:function(){var open=txt('shift-status-label').indexOf('เปิดร้านอยู่')>=0; return '🗄️ เปิด/ปิดกะ — '+(open?'เปิดร้านอยู่ (แตะเพื่อปิดกะ)':'ยังไม่เปิดร้าน (แตะเพื่อเปิดกะ)');},
  lock:function(){var u=txt('active-user-badge'); return '🔒 ล็อกหน้าจอ / สลับผู้ใช้'+(u?' — '+u:'');},
  hold:function(){var n=shown('held-bills-count')?parseInt(txt('held-bills-count'),10)||0:0; return '📋 พักบิล'+(n?' — มี '+n+' บิลที่พักไว้':'');},
  cart:function(){var n=shown('header-cart-count')?parseInt(txt('header-cart-count'),10)||0:0; return '🛒 ตะกร้า'+(n?' — '+n+' ชิ้น':' — ยังว่าง');},
  sync:function(){var q=shown('sync-queue-badge')?txt('sync-queue-badge'):''; return '🔄 ซิงค์ข้อมูลกับ Supabase'+(q?' — '+q:'');},
  scan:function(){return '📸 เปิด/ปิดกล้องสแกนบาร์โค้ด';}
};
function hide(){ tip.classList.remove('on'); }
function show(btn){
  var f=TIPS[btn.dataset.hb]; if(!f) return;
  tip.textContent=f(); tip.classList.add('on');
  var r=btn.getBoundingClientRect(), w=tip.offsetWidth, left=Math.max(6,Math.min(window.innerWidth-w-6,r.left+r.width/2-w/2));
  tip.style.left=left+'px'; tip.style.top=(r.bottom+8)+'px';
  clearTimeout(T); T=setTimeout(hide,1800);
}
document.addEventListener('pointerdown',function(e){ var b=e.target.closest&&e.target.closest('[data-hb]'); if(b) show(b); },true);
document.addEventListener('mouseover',function(e){ var b=e.target.closest&&e.target.closest('[data-hb]'); if(b) show(b); });
document.addEventListener('mouseout',function(e){ if(e.target.closest&&e.target.closest('[data-hb]')) hide(); });
window.__headerTips={TIPS:TIPS};
})();
