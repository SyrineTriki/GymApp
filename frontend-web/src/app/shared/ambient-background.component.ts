import { Component } from '@angular/core';

/**
 * Soft floating gradient orbs behind the dashboard content, matching the
 * Lovable admin shell's ambient background. Purely decorative (aria-hidden).
 *
 * Usage: place <app-ambient-background></app-ambient-background> as the
 * first child inside your `.shell` container.
 */
@Component({
  selector: 'app-ambient-background',
  standalone: true,
  template: `
    <div aria-hidden="true" class="ambient-bg">
      <div class="ambient-orb orb-teal"></div>
      <div class="ambient-orb orb-violet"></div>
      <div class="ambient-orb orb-amber"></div>
    </div>
  `,
  styles: [`
    .ambient-bg {
      position: fixed;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
    }
    .ambient-orb {
      position: absolute;
      border-radius: 9999px;
      filter: blur(70px);
      opacity: 0.55;
      animation: ambient-float 12s ease-in-out infinite;
    }
    .orb-teal {
      top: -10%; left: -5%;
      width: 24rem; height: 24rem;
      background: rgba(79, 214, 196, 0.22);
    }
    .orb-violet {
      top: 40%; right: -8%;
      width: 28rem; height: 28rem;
      background: rgba(156, 123, 240, 0.2);
      animation-delay: -4s;
    }
    .orb-amber {
      top: 80%; left: 30%;
      width: 18rem; height: 18rem;
      background: rgba(240, 185, 92, 0.12);
      animation-delay: -8s;
    }
    @keyframes ambient-float {
      0%, 100% { transform: translate3d(0, 0, 0); }
      50%      { transform: translate3d(20px, -30px, 0); }
    }
  `],
})
export class AmbientBackgroundComponent {}
