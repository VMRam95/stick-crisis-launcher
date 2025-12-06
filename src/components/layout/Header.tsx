"use client";

import Link from "next/link";
import { PixelButton } from "@/components/ui";
import { ITCH_URL } from "@/lib/constants";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-pixel-bg-primary/95 backdrop-blur border-b-2 border-pixel-text-muted">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="font-pixel text-pixel-sm text-pixel-accent-green group-hover:text-pixel-accent-cyan transition-colors">
              [&gt;_]
            </span>
            <span className="font-pixel text-pixel-xs text-pixel-text-primary uppercase hidden sm:inline">
              Stick Crisis
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="font-pixel text-pixel-xs text-pixel-text-secondary hover:text-pixel-accent-green transition-colors uppercase"
            >
              Features
            </Link>
            <Link
              href="#changelog"
              className="font-pixel text-pixel-xs text-pixel-text-secondary hover:text-pixel-accent-green transition-colors uppercase"
            >
              Changelog
            </Link>
            <Link
              href="#newsletter"
              className="font-pixel text-pixel-xs text-pixel-text-secondary hover:text-pixel-accent-green transition-colors uppercase"
            >
              Newsletter
            </Link>
            <Link
              href="/admin"
              className="font-pixel text-pixel-xs text-pixel-text-muted hover:text-pixel-accent-pink transition-colors uppercase"
            >
              Admin
            </Link>
          </nav>

          {/* CTA */}
          <a href={ITCH_URL} target="_blank" rel="noopener noreferrer">
            <PixelButton size="sm">
              Download
            </PixelButton>
          </a>
        </div>
      </div>
    </header>
  );
}
