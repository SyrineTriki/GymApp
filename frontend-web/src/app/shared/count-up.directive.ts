import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

/**
 * Animates a number counting up from 0 to the given value, matching the
 * Lovable admin panel's CountUp component (originally framer-motion driven).
 *
 * Usage: <div class="stat-value" [appCountUp]="stats.total_athletes"></div>
 * Optional: [duration]="1.4" (seconds), [suffix]="'%'", [prefix]="'$'"
 */
@Directive({
  selector: '[appCountUp]',
  standalone: true,
})
export class CountUpDirective implements OnChanges {
  @Input('appCountUp') value = 0;
  @Input() duration = 1.2; // seconds
  @Input() prefix = '';
  @Input() suffix = '';

  private hasAnimated = false;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.value != null) {
      this.animateTo(this.value);
    }
  }

  private animateTo(target: number): void {
    const start = 0;
    const startTime = performance.now();
    const durationMs = this.duration * 1000;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // cubic ease-out

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / durationMs, 1);
      const current = Math.round(start + (target - start) * ease(t));
      this.el.nativeElement.textContent = `${this.prefix}${current.toLocaleString()}${this.suffix}`;
      if (t < 1) requestAnimationFrame(step);
    };

    this.hasAnimated = true;
    requestAnimationFrame(step);
  }
}
