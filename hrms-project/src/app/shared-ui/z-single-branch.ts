// v1.67.6 (setup) item 11 – a company (for this user) with one branch: the pickers take it, the filters do not offer it.
export function singleBranch(): { id: number; name: string } | null {
  try {
    const v = JSON.parse(localStorage.getItem('zeoSingleBranch') || 'null');
    return v && v.schema === localStorage.getItem('selectedSchema') ? { id: v.id, name: v.name } : null;
  } catch { return null; }
}

/**
 * v1.67.9 (screens) item 19: one branch filter for every list and report. Screens that still draw their own branch drop-down
 * as a FILTER (not a form field: outside forms / dialogs / tables, an empty "all" choice first) offer nothing when the user
 * works in one branch – it is hidden, so single-branch users see the branch fixed (the top bar shows it). Runs outside
 * Angular on DOM changes, like z-legacy-head.
 */
const FILTER_SCOPE = 'form, [data-zform], .modal, dialog, table, .zl-bar, .zl-menu, [data-zl], .cdk-overlay-container, z-form';
function hideOwnBranchFilters(root: ParentNode): void {
  const one = singleBranch();
  if (!one) { return; }
  // Angular [ngValue] options read "0: undefined" / "0: null" for the empty choice
  const allLike = (o: HTMLOptionElement) => o.value === '' || /^\d+: (undefined|null)$/.test(o.value) || /^(all|–|-|choose|select|كل|جميع|الكل|اختر)/i.test(o.text.trim());
  root.querySelectorAll?.('select:not([data-zsb])').forEach(n => {
    const sel = n as HTMLSelectElement;
    if (sel.closest(FILTER_SCOPE) || !sel.options.length || sel.multiple) { return; }
    const opts = Array.from(sel.options);
    const named = opts.filter(o => !allLike(o));
    if (named.length !== 1 || named[0].text.trim() !== one.name) { return; }   // only a choice between "all" and the user's one branch
    sel.dataset['zsb'] = '1';
    const first = opts[0];
    if (allLike(first) && !/^(choose|select|اختر)/i.test(first.text.trim())) {   // "All branches" = the one branch: nothing to choose
      sel.style.display = 'none';
      const wrap = sel.parentElement;   // a label / field box that only holds this drop-down
      if (wrap && wrap.children.length <= 2 && !wrap.querySelector('input, textarea, button')) { wrap.style.display = 'none'; }
      return;
    }
    // "Choose…" or the branch alone: the branch is chosen and fixed
    if (sel.value !== named[0].value) { sel.value = named[0].value; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    sel.disabled = true;
    sel.title = one.name;
  });
}
let sbStarted = false;
export function startSingleBranchFilters(): void {
  if (sbStarted || typeof document === 'undefined') { return; }
  sbStarted = true;
  const root = (window as any).Zone?.root;
  const go = () => {
    let raf = 0;
    new MutationObserver(() => { if (!raf) { raf = requestAnimationFrame(() => { raf = 0; hideOwnBranchFilters(document); }); } })
      .observe(document.body, { childList: true, subtree: true });
    hideOwnBranchFilters(document);
  };
  if (root && (window as any).Zone?.current !== root) { root.run(go); } else { go(); }
}
