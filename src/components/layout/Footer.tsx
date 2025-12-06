"use client";

import Link from "next/link";
import { ITCH_URL } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-pixel-bg-secondary border-t-2 border-pixel-text-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Description */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-pixel text-pixel-sm text-pixel-accent-green">
                [&gt;_]
              </span>
              <span className="font-pixel text-pixel-xs text-pixel-text-primary uppercase">
                Stick Crisis
              </span>
            </div>
            <p className="text-pixel-text-secondary text-sm font-mono">
              Intense stick figure combat action. Master weapons, defeat enemies,
              survive the crisis.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-pixel text-pixel-xs text-pixel-accent-cyan uppercase mb-3">
              Links
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href={ITCH_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pixel-text-secondary hover:text-pixel-accent-green text-sm font-mono transition-colors"
                >
                  itch.io
                </a>
              </li>
              <li>
                <Link
                  href="#changelog"
                  className="text-pixel-text-secondary hover:text-pixel-accent-green text-sm font-mono transition-colors"
                >
                  Changelog
                </Link>
              </li>
              <li>
                <Link
                  href="#newsletter"
                  className="text-pixel-text-secondary hover:text-pixel-accent-green text-sm font-mono transition-colors"
                >
                  Newsletter
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-pixel text-pixel-xs text-pixel-accent-cyan uppercase mb-3">
              Developer
            </h4>
            <p className="text-pixel-text-secondary text-sm font-mono">
              Created by VMRam95
            </p>
            <a
              href="https://vmram95.itch.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pixel-accent-green hover:text-pixel-accent-cyan text-sm font-mono transition-colors"
            >
              vmram95.itch.io
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-4 border-t border-pixel-text-muted flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-pixel text-pixel-xs text-pixel-text-muted">
            &copy; {currentYear} Stick Crisis
          </p>
          <p className="font-mono text-xs text-pixel-text-muted">
            Made with{" "}
            <span className="text-pixel-accent-red">&lt;3</span> and Unity
          </p>
        </div>
      </div>
    </footer>
  );
}
