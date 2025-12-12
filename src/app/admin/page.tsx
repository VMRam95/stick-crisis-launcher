"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PixelButton,
  PixelInput,
  PixelCard,
  LoadingSpinner,
  useToast,
} from "@/components/ui";

interface Stats {
  totalChangelogs: number;
  publishedChangelogs: number;
  totalSubscribers: number;
  activeSubscribers: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  async function checkAuth() {
    try {
      const response = await fetch("/api/admin/auth");
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch {
      setIsAuthenticated(false);
    }
  }

  async function fetchStats() {
    setStatsLoading(true);
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      showToast("Login successful", "success");
      setIsAuthenticated(true);
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Login failed", "error");
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <PixelCard className="max-w-md w-full">
          <div className="text-center mb-8">
            <span className="font-pixel text-pixel-sm text-pixel-accent-cyan">
              [ADMIN]
            </span>
            <h1 className="font-pixel text-pixel-xs text-pixel-text-primary mt-4 uppercase">
              Login Required
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <PixelInput
              type="password"
              label="Password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <PixelButton
              type="submit"
              disabled={loading || !password}
              className="w-full"
            >
              {loading ? "Logging in..." : "Login"}
            </PixelButton>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="font-mono text-sm text-pixel-text-muted hover:text-pixel-accent-green"
            >
              ← Back to site
            </Link>
          </div>
        </PixelCard>
      </div>
    );
  }

  // Dashboard
  return (
    <div>
      <h1 className="font-pixel text-pixel-sm text-pixel-text-primary uppercase mb-8">
        Dashboard
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <PixelCard>
          <div className="text-center">
            <span className="font-pixel text-pixel-md text-pixel-accent-yellow block">
              {statsLoading ? "-" : stats?.totalChangelogs || 0}
            </span>
            <span className="font-mono text-pixel-text-muted text-sm">
              Total Changelogs
            </span>
          </div>
        </PixelCard>

        <PixelCard>
          <div className="text-center">
            <span className="font-pixel text-pixel-md text-pixel-accent-green block">
              {statsLoading ? "-" : stats?.publishedChangelogs || 0}
            </span>
            <span className="font-mono text-pixel-text-muted text-sm">
              Published
            </span>
          </div>
        </PixelCard>

        <PixelCard>
          <div className="text-center">
            <span className="font-pixel text-pixel-md text-pixel-accent-cyan block">
              {statsLoading ? "-" : stats?.totalSubscribers || 0}
            </span>
            <span className="font-mono text-pixel-text-muted text-sm">
              Total Subscribers
            </span>
          </div>
        </PixelCard>

        <PixelCard>
          <div className="text-center">
            <span className="font-pixel text-pixel-md text-pixel-accent-pink block">
              {statsLoading ? "-" : stats?.activeSubscribers || 0}
            </span>
            <span className="font-mono text-pixel-text-muted text-sm">
              Active Subscribers
            </span>
          </div>
        </PixelCard>
      </div>

      {/* Quick Actions */}
      <h2 className="font-pixel text-pixel-xs text-pixel-text-secondary uppercase mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/deployments">
          <PixelCard
            variant="outlined"
            className="hover:border-pixel-accent-green transition-colors cursor-pointer"
          >
            <h3 className="font-pixel text-pixel-xs text-pixel-accent-green uppercase mb-2">
              Manage Deployments
            </h3>
            <p className="font-mono text-pixel-text-secondary text-sm">
              Deploy new versions and view history
            </p>
          </PixelCard>
        </Link>

        <Link href="/admin/subscribers">
          <PixelCard
            variant="outlined"
            className="hover:border-pixel-accent-cyan transition-colors cursor-pointer"
          >
            <h3 className="font-pixel text-pixel-xs text-pixel-accent-cyan uppercase mb-2">
              View Subscribers
            </h3>
            <p className="font-mono text-pixel-text-secondary text-sm">
              Manage newsletter subscribers
            </p>
          </PixelCard>
        </Link>

        <Link href="/admin/subscribers">
          <PixelCard
            variant="outlined"
            className="hover:border-pixel-accent-pink transition-colors cursor-pointer"
          >
            <h3 className="font-pixel text-pixel-xs text-pixel-accent-pink uppercase mb-2">
              Send Newsletter
            </h3>
            <p className="font-mono text-pixel-text-secondary text-sm">
              Email all active subscribers
            </p>
          </PixelCard>
        </Link>
      </div>
    </div>
  );
}
