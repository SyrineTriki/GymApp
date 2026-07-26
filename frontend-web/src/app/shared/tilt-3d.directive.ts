import { Directive, ElementRef, HostListener, Input, OnInit, Renderer2 } from '@angular/core';

/**
 * Pointer-driven 3D tilt + glare effect, matching the Lovable admin panel's
 * Tilt3D component (originally built with framer-motion). Pure DOM/CSS here —
 * no animation library needed.
 *
 * Usage: <div appTilt3d class="stat-card"> ... </div>
 * Optional: <div appTilt3d [tiltIntensity]="10"> ... </div>
 */
@Directive({
  selector: '[appTilt3d]',
  standalone: true,
})
export class Tilt3dDirective implements OnInit {
  @Input() tiltIntensity = 8;

  private glareEl!: HTMLDivElement;

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngOnInit(): void {
    const host = this.el.nativeElement;

    // Prep host for 3D transforms
    this.renderer.setStyle(host, 'position', 'relative');
    this.renderer.setStyle(host, 'transform-style', 'preserve-3d');
    this.renderer.setStyle(host, 'will-change', 'transform');
    this.renderer.setStyle(host, 'transition', 'transform 350ms cubic-bezier(0.16,1,0.3,1), box-shadow 350ms cubic-bezier(0.16,1,0.3,1)');

    // Glare overlay
    this.glareEl = this.renderer.createElement('div');
    this.renderer.setStyle(this.glareEl, 'position', 'absolute');
    this.renderer.setStyle(this.glareEl, 'inset', '0');
    this.renderer.setStyle(this.glareEl, 'border-radius', 'inherit');
    this.renderer.setStyle(this.glareEl, 'pointer-events', 'none');
    this.renderer.setStyle(this.glareEl, 'opacity', '0');
    this.renderer.setStyle(this.glareEl, 'mix-blend-mode', 'overlay');
    this.renderer.setStyle(this.glareEl, 'transition', 'opacity 300ms ease');
    this.renderer.appendChild(host, this.glareEl);
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(e: PointerEvent): void {
    const host = this.el.nativeElement;
    const rect = host.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;   // 0..1
    const py = (e.clientY - rect.top) / rect.height;    // 0..1
    const nx = px - 0.5; // -0.5..0.5
    const ny = py - 0.5;

    const rotateY = nx * this.tiltIntensity * 2;
    const rotateX = -ny * this.tiltIntensity * 2;

    this.renderer.setStyle(
      host,
      'transform',
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`,
    );

    this.renderer.setStyle(
      this.glareEl,
      'background',
      `radial-gradient(500px circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.14), transparent 40%)`,
    );
    this.renderer.setStyle(this.glareEl, 'opacity', '1');
  }

  @HostListener('pointerleave')
  onPointerLeave(): void {
    const host = this.el.nativeElement;
    this.renderer.setStyle(host, 'transform', 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)');
    this.renderer.setStyle(this.glareEl, 'opacity', '0');
  }
}
