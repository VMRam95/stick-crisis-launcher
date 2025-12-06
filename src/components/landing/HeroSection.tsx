"use client";

import { PixelButton } from "@/components/ui";
import { ITCH_URL, APP_NAME } from "@/lib/constants";

export function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Scanlines Overlay */}
      <div className="absolute inset-0 scanlines pointer-events-none opacity-30" />

      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Logo/Title */}
        <div className="mb-8 animate-pulse-slow">
          <span className="font-pixel text-pixel-lg md:text-pixel-xl text-pixel-accent-green block mb-2">
            [&gt;_]
          </span>
          <h1 className="font-pixel text-pixel-md md:text-pixel-lg text-pixel-text-primary uppercase tracking-wider">
            {APP_NAME}
          </h1>
        </div>

        {/* Tagline */}
        <p className="font-mono text-lg md:text-xl text-pixel-text-secondary max-w-2xl mx-auto mb-4">
          Intense stick figure combat action.
        </p>
        <p className="font-mono text-base text-pixel-text-muted max-w-xl mx-auto mb-12">
          Master an arsenal of weapons, defeat waves of enemies, and survive the ultimate crisis.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a href={ITCH_URL} target="_blank" rel="noopener noreferrer">
            <PixelButton size="lg" className="min-w-[200px]">
              Download Now
            </PixelButton>
          </a>
          <a href="#features">
            <PixelButton variant="secondary" size="lg" className="min-w-[200px]">
              Learn More
            </PixelButton>
          </a>
        </div>

        {/* Platform Badges */}
        <div className="mt-12 flex justify-center gap-6 text-pixel-text-muted">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-pixel-xs">WIN</span>
            <span className="text-pixel-accent-green">&#x2713;</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-pixel text-pixel-xs">MAC</span>
            <span className="text-pixel-accent-green">&#x2713;</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <span className="font-pixel text-pixel-xs text-pixel-text-muted">
            &#x25BC;
          </span>
        </div>
      </div>
    </section>
  );
}
