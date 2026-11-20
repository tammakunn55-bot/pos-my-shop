
(function () {
  'use strict';
  const KEY = 'pos_session';
  window.posSessionToken = function () {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!s || !s.token || !(s.exp > Date.now())) return null;
      return s.token;
    } catch (e) { return null; }
  };
  function saveSession(token, userId, ttlSec) {
    localStorage.setItem(KEY, JSON.stringify({ token, userId, exp: Date.now() + ttlSec * 1000 }));
  }
  // ขอ token หลังล็อกอินสำเร็จ (ถ้าออฟไลน์หรือเซิร์ฟเวอร์ไม่รู้จักผู้ใช้ จะใช้กติกาเดิมแทน)
  async function obtainSession(u) {
    const c = window.getSupabaseClient?.();
    if (!c || !u || !u.pinHash || u.role === 'OWNER') return;   // เจ้าของร้านไม่ได้ซิงก์ไปยัง app_users
    try {
      const { data, error } = await c.rpc('employee_login', { p_app_user_id: toUUID(u.id), p_pin_hash: u.pinHash });
      if (!error && data && data.ok) saveSession(data.session, u.id, data.expires_in_sec || 43200);
      else localStorage.removeItem(KEY);
    } catch (e) { /* ออฟไลน์: ไม่มี token ใช้กติกาเดิม */ }
  }
  async function endSession() {
    const t = window.posSessionToken();
    localStorage.removeItem(KEY);
    if (!t) return;
    try { await window.getSupabaseClient?.()?.rpc('employee_logout', { p_session: t }); } catch (e) {}
  }

  // ห่อการล็อกอินด้วย PIN: เมื่อสำเร็จให้ขอ token
  const origVerify = window.verifyEmployeePin;
  if (typeof origVerify === 'function') {
    window.verifyEmployeePin = async function () {
      const before = window.db && window.db.activeUser;
      const r = await origVerify.apply(this, arguments);
      const now = window.db && window.db.activeUser;
      if (now && now !== before) obtainSession(now);
      return r;
    };
  }
  const origLock = window.lockPOS;
  if (typeof origLock === 'function') {
    window.lockPOS = function () { endSession(); return origLock.apply(this, arguments); };
  }
  // คิวปรับสต็อก: แนบ token ตอนนั้นไปด้วย เพื่อให้ผู้ที่ทำรายการถูกตรวจสิทธิ์
  const origEnqueue = window.enqueueSync;
  if (typeof origEnqueue === 'function') {
    window.enqueueSync = function (op, a, b) {
      if (op && ['adjust', 'sale', 'delete'].includes(op.type) && op.payload && !op.payload.sessionToken) {
        const t = window.posSessionToken();
        if (t) op.payload.sessionToken = t;
      }
      return origEnqueue.call(this, op, a, b);
    };
  }
})();
