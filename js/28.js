
(function () {
  'use strict';
  const fmt = v => (window.formatMoney ? window.formatMoney(v) : '฿' + (Math.round((+v || 0) * 100) / 100).toFixed(2));
  function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function dailyCheck() {
    const from = startOfToday(), now = Date.now();
    const bills = (db.bills || []).filter(b => b.time >= from && b.time <= now);
    const live = bills.filter(b => !b.isRefunded);
    const sumBy = m => live.filter(b => b.method === m).reduce((s, b) => s + (+b.total || 0), 0);
    const refunded = bills.filter(b => b.isRefunded);
    const shifts = (db.shifts || []).filter(s => (s.startTime || 0) >= from || (s.endTime || 0) >= from);
    const shiftCash = shifts.reduce((s, sh) => s + (window.computeShiftSummary ? window.computeShiftSummary(sh).cashSales : 0), 0);
    const cashBills = sumBy('CASH');
    const issues = [];
    if (Math.abs(cashBills - shiftCash) > 0.01) issues.push('ยอดเงินสดจากบิลวันนี้ (' + fmt(cashBills) + ') ไม่ตรงกับยอดในกะ (' + fmt(shiftCash) + ') — อาจมีบิลที่ขายนอกช่วงเปิดกะ');
    const noMethod = live.filter(b => !['CASH', 'TRANSFER', 'CREDIT'].includes(b.method));
    if (noMethod.length) issues.push('มีบิล ' + noMethod.length + ' ใบที่ไม่ระบุวิธีชำระ');
    const zero = live.filter(b => !(+b.total > 0));
    if (zero.length) issues.push('มีบิล ' + zero.length + ' ใบที่ยอดเป็นศูนย์หรือติดลบ');
    const noShift = !db.currentShift ? 'ยังไม่ได้เปิดร้าน (เปิดกะและใส่เงินทอนเริ่มต้นก่อนขาย)' : '';
    return { count: live.length, total: live.reduce((s, b) => s + (+b.total || 0), 0), cash: cashBills, transfer: sumBy('TRANSFER'), credit: sumBy('CREDIT'),
      refundCount: refunded.length, refundTotal: refunded.reduce((s, b) => s + (+b.total || 0), 0), shiftCount: shifts.length, issues, noShift };
  }
  function render(host) {
    const r = dailyCheck();
    let box = document.getElementById('pos-daycheck');
    if (!box) { box = document.createElement('div'); box.id = 'pos-daycheck'; box.style.cssText = 'margin:8px 0;padding:10px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;font-size:13px;color:#0f172a'; host.insertBefore(box, host.firstChild); }
    const ok = r.issues.length === 0 && !r.noShift;
    box.innerHTML = '<div style="font-weight:800;margin-bottom:6px">📊 สรุปยอดขายวันนี้ ' + (ok ? '<span style="color:#059669">✔ ถูกต้อง</span>' : '<span style="color:#b91c1c">⚠ ต้องตรวจ</span>') + '</div>' +
      '<div>บิลขาย ' + r.count + ' ใบ · รวม <b>' + fmt(r.total) + '</b></div>' +
      '<div>เงินสด ' + fmt(r.cash) + ' · โอน ' + fmt(r.transfer) + ' · เชื่อ ' + fmt(r.credit) + '</div>' +
      '<div>คืนสินค้า ' + r.refundCount + ' ใบ · ' + fmt(r.refundTotal) + ' · กะที่เปิดวันนี้ ' + r.shiftCount + ' กะ</div>' +
      (r.noShift ? '<div style="color:#b91c1c;margin-top:4px">' + r.noShift + '</div>' : '') +
      r.issues.map(x => '<div style="color:#b91c1c;margin-top:4px">• ' + x + '</div>').join('') +
      '<div style="margin-top:6px;color:#64748b">เปิดร้าน = เปิดกะพร้อมใส่เงินทอนเริ่มต้น ปิดกะจะเทียบยอดเงินสดกับที่นับจริง</div>';
  }
  const orig = window.openShiftModal;
  if (typeof orig === 'function' && !orig.__v24) {
    const w = function () {
      const r = orig.apply(this, arguments);
      const m = document.getElementById('modal-shift');
      const host = m && (m.querySelector('.bg-white') || m.firstElementChild || m);
      if (host) render(host);
      return r;
    };
    w.__v24 = true; window.openShiftModal = w;
  }
  window.posDailySalesCheck = dailyCheck;
})();
