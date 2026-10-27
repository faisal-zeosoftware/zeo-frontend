// v1.62.0 EOS – Leavers workspace: one look for the list and the case page (cards, clear type, amounts aligned to the end, RTL-safe)
export const LV_STYLES = `
.lv{--ink:#1b1640;--ink2:#3b3f55;--mut:#6b7085;--line:#e6e8f0;--soft:#f6f7fb;--acc:#4f46e5;--acc2:#eef0ff;--ok:#16794a;--okbg:#e6f5ec;
  --warn:#9a6200;--warnbg:#fff4dc;--bad:#b42318;--badbg:#fdecea;--info:#1f4f8a;--infobg:#e8f0fb;
  padding:22px 26px 40px;background:var(--soft);min-height:calc(100vh - 64px);color:var(--ink2);font-size:13.5px}
.lv *{box-sizing:border-box}
.lv .card{background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 1px 2px rgba(27,22,64,.04)}
.lv h1{font-size:24px;font-weight:700;color:var(--ink);margin:0;letter-spacing:-.2px}
.lv h2{font-size:15px;font-weight:700;color:var(--ink);margin:0}
.lv h3{font-size:12px;font-weight:700;color:var(--mut);margin:0;text-transform:uppercase;letter-spacing:.5px}
.lv .mut{color:var(--mut)}
.lv .num{font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:isolate;white-space:nowrap}
.lv .lv-head{display:flex;flex-direction:row;justify-content:space-between;align-items:flex-start;gap:16px;padding:20px 24px;border-bottom:3px solid var(--acc)}
.lv .lv-head p{margin:6px 0 0;color:var(--mut);max-width:760px;line-height:1.5}
.lv .lv-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:36px;padding:0 14px;border-radius:9px;border:1px solid #d5d8e5;
  background:#fff;color:var(--ink);font-weight:600;font-size:13px;cursor:pointer;white-space:nowrap;text-decoration:none}
.lv .lv-btn:hover{background:#f4f5fa}
.lv .lv-btn.primary{background:var(--acc);border-color:var(--acc);color:#fff}
.lv .lv-btn.primary:hover{background:#4338ca}
.lv .lv-btn.danger{color:var(--bad);border-color:#f0c4bf}
.lv .lv-btn.ok{background:var(--ok);border-color:var(--ok);color:#fff}
.lv .lv-btn.sm{height:30px;padding:0 10px;font-size:12px;border-radius:8px}
.lv .lv-btn[disabled]{opacity:.55;cursor:default}
.lv .lv-btn .material-icons{font-size:18px}
.lv .lv-link{background:none;border:0;color:var(--acc);font-weight:600;cursor:pointer;padding:0;font-size:12.5px}
.lv .chip{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border-radius:11px;font-size:11.5px;font-weight:600;background:#eef0f4;color:#3b3f55;white-space:nowrap}
.lv .chip.ok{background:var(--okbg);color:var(--ok)}.lv .chip.warn{background:var(--warnbg);color:var(--warn)}
.lv .chip.bad{background:var(--badbg);color:var(--bad)}.lv .chip.info{background:var(--infobg);color:var(--info)}.lv .chip.acc{background:var(--acc2);color:var(--acc)}
.lv .av{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#6d64f0,#4f46e5);color:#fff;display:flex;align-items:center;justify-content:center;
  font-weight:700;font-size:13px;flex:0 0 auto;overflow:hidden}
.lv .av img{width:100%;height:100%;object-fit:cover}
.lv .av.lg{width:68px;height:68px;font-size:22px}
.lv input.f,.lv select.f,.lv textarea.f{height:36px;border:1px solid #d5d8e5;border-radius:9px;padding:0 10px;background:#fff;color:var(--ink);font-size:13px;min-width:0}
.lv textarea.f{height:auto;padding:8px 10px;resize:vertical}
.lv input.f:focus,.lv select.f:focus,.lv textarea.f:focus{outline:2px solid #c7c3fb;border-color:var(--acc)}
.lv label.fl{display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:600;color:var(--ink2)}
.lv .msg{margin:12px 0 0;padding:10px 14px;border-radius:10px;background:var(--okbg);color:var(--ok);font-weight:500}
.lv .msg.err{background:var(--badbg);color:var(--bad)}
/* step indicator */
.lv .steps{display:flex;align-items:center;gap:0}
.lv .steps i{width:10px;height:10px;border-radius:50%;background:#d9dce6;flex:0 0 auto;position:relative}
.lv .steps i.done{background:var(--ok)}
.lv .steps i.cur{background:#fff;box-shadow:0 0 0 2px var(--acc) inset}
.lv .steps b{height:2px;width:14px;background:#d9dce6;flex:0 0 auto}
.lv .steps b.done{background:var(--ok)}
/* table */
.lv table.lt{width:100%;border-collapse:separate;border-spacing:0}
.lv table.lt thead th{background:#fafbfd !important;color:var(--mut) !important;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;
  padding:10px 12px !important;border:0 !important;border-bottom:1px solid var(--line) !important;text-align:start;white-space:nowrap}
.lv table.lt td{padding:11px 12px;border-bottom:1px solid #eff0f5;vertical-align:middle;text-align:start}
.lv table.lt tbody tr{cursor:pointer}
.lv table.lt tbody tr:hover td{background:#fafaff}
.lv table.lt .end{text-align:end}
.lv .empty{padding:48px 20px;text-align:center;color:var(--mut)}
.lv .empty .material-icons{font-size:40px;color:#c4c7d6;display:block;margin:0 auto 8px}
/* dialog */
.lv-dlg-back{position:fixed;inset:0;background:rgba(20,18,40,.38);z-index:1050;display:flex;align-items:flex-start;justify-content:center;padding:70px 16px;overflow:auto}
.lv-dlg{width:min(620px,100%);background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(20,18,40,.25)}
.lv-dlg header{padding:18px 22px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center}
.lv-dlg .body{padding:18px 22px;display:grid;grid-template-columns:1fr 1fr;gap:14px}
.lv-dlg .body .wide{grid-column:1 / -1}
.lv-dlg footer{padding:14px 22px;border-top:1px solid var(--line);display:flex;justify-content:flex-end;gap:8px}
.lv .err-t{color:var(--bad);font-size:11.5px;font-weight:500}
@media print{.lv .no-print{display:none !important}}
`;
