"use client";

import { useState } from "react";
import { PixelButton, PixelInput, PixelCard, useToast } from "@/components/ui";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      showToast("Successfully subscribed! Check your email.", "success");
      setEmail("");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to subscribe",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="newsletter" className="py-20 bg-pixel-bg-secondary">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <PixelCard variant="glow" className="text-center">
            {/* Header */}
            <div className="mb-8">
              <span className="font-pixel text-pixel-xs text-pixel-accent-pink uppercase tracking-wider">
                {"// Newsletter"}
              </span>
              <h2 className="font-pixel text-pixel-sm md:text-pixel-md text-pixel-text-primary mt-4 uppercase">
                Stay Updated
              </h2>
              <p className="font-mono text-pixel-text-secondary mt-4">
                Subscribe to get notified about new updates, features, and
                releases.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <PixelInput
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full"
                  />
                </div>
                <PixelButton
                  type="submit"
                  disabled={loading}
                  className="sm:w-auto"
                >
                  {loading ? "Subscribing..." : "Subscribe"}
                </PixelButton>
              </div>
            </form>

            {/* Privacy Note */}
            <p className="font-mono text-pixel-text-muted text-xs mt-6">
              No spam, unsubscribe anytime. We respect your privacy.
            </p>

            {/* Decoration */}
            <div className="mt-8 flex justify-center gap-2">
              <span className="text-pixel-accent-green">&#x25A0;</span>
              <span className="text-pixel-accent-cyan">&#x25A0;</span>
              <span className="text-pixel-accent-pink">&#x25A0;</span>
              <span className="text-pixel-accent-yellow">&#x25A0;</span>
            </div>
          </PixelCard>
        </div>
      </div>
    </section>
  );
}
