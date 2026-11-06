// v1.67.5 (bugs) S1
import { Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';

/**
 * v1.67.5 (bugs) S1 – a dialog that lives inside a page is moved to <body> while it is shown. Inside the page it sat in the
 * page's stacking context, so on a laptop-size window (1024 px) the left menu covered part of "New shift pattern" whatever
 * its z-index. The shared form (z-form) is already attached to <body>; this does the same for the screens' own dialogs.
 * Angular keeps its bindings on the moved element and removes it from <body> when the *ngIf closes it.
 */
@Directive({ selector: '[zPortal]', standalone: true })
export class ZPortalDirective implements OnInit, OnDestroy {
  constructor(private el: ElementRef<HTMLElement>) {}
  ngOnInit(): void {
    const n = this.el.nativeElement;
    const rtl = document.documentElement.getAttribute('dir') === 'rtl' || document.body.getAttribute('dir') === 'rtl';
    if (rtl) { n.setAttribute('dir', 'rtl'); }
    document.body.appendChild(n);
  }
  ngOnDestroy(): void { this.el.nativeElement.remove(); }
}
