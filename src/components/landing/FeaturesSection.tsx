"use client";

import { PixelCard } from "@/components/ui";

const features = [
  {
    icon: "⚔️",
    title: "Arsenal of Weapons",
    description:
      "Wield swords, bows, shurikens, and more. Each weapon has unique mechanics and devastating combos.",
  },
  {
    icon: "🎮",
    title: "Fast-Paced Combat",
    description:
      "Fluid stick figure animations meet intense action. Dodge, attack, and chain combos to survive.",
  },
  {
    icon: "👾",
    title: "Enemy Variety",
    description:
      "Face different enemy types from peasants to samurai archers. Each requires different strategies.",
  },
  {
    icon: "🏆",
    title: "High Score Chase",
    description:
      "Compete for the highest score. Master the combat system to maximize your streak.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-pixel-bg-secondary">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-pixel text-pixel-xs text-pixel-accent-cyan uppercase tracking-wider">
            {"// Features"}
          </span>
          <h2 className="font-pixel text-pixel-sm md:text-pixel-md text-pixel-text-primary mt-4 uppercase">
            What Makes It Fun
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <PixelCard
              key={index}
              variant="outlined"
              className="text-center hover:border-pixel-accent-green transition-colors"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="font-pixel text-pixel-xs text-pixel-accent-green uppercase mb-3">
                {feature.title}
              </h3>
              <p className="text-pixel-text-secondary text-sm font-mono">
                {feature.description}
              </p>
            </PixelCard>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <span className="font-pixel text-pixel-md text-pixel-accent-green block">
              5+
            </span>
            <span className="font-mono text-pixel-text-muted text-sm">
              Weapons
            </span>
          </div>
          <div>
            <span className="font-pixel text-pixel-md text-pixel-accent-cyan block">
              4+
            </span>
            <span className="font-mono text-pixel-text-muted text-sm">
              Enemy Types
            </span>
          </div>
          <div>
            <span className="font-pixel text-pixel-md text-pixel-accent-yellow block">
              ∞
            </span>
            <span className="font-mono text-pixel-text-muted text-sm">
              Replayability
            </span>
          </div>
          <div>
            <span className="font-pixel text-pixel-md text-pixel-accent-pink block">
              2
            </span>
            <span className="font-mono text-pixel-text-muted text-sm">
              Platforms
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
