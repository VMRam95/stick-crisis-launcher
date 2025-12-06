"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { PixelButton, LoadingSpinner } from "@/components/ui";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch("/api/admin/auth");
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch {
      setIsAuthenticated(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      setIsAuthenticated(false);
      router.push("/admin");
    } catch (error) {
      console.error("Logout error:", error);
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

  // Not authenticated - show login form on /admin only
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // Authenticated - show admin layout
  return (
    <div className="min-h-screen bg-pixel-bg-primary">
      {/* Admin Header */}
      <header className="bg-pixel-bg-secondary border-b-2 border-pixel-accent-cyan">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="flex items-center gap-2">
                <span className="font-pixel text-pixel-xs text-pixel-accent-cyan">
                  [ADMIN]
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-4">
                <Link
                  href="/admin"
                  className={`font-pixel text-pixel-xs uppercase transition-colors ${
                    pathname === "/admin"
                      ? "text-pixel-accent-green"
                      : "text-pixel-text-secondary hover:text-pixel-accent-green"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/changelog"
                  className={`font-pixel text-pixel-xs uppercase transition-colors ${
                    pathname === "/admin/changelog"
                      ? "text-pixel-accent-green"
                      : "text-pixel-text-secondary hover:text-pixel-accent-green"
                  }`}
                >
                  Changelog
                </Link>
                <Link
                  href="/admin/subscribers"
                  className={`font-pixel text-pixel-xs uppercase transition-colors ${
                    pathname === "/admin/subscribers"
                      ? "text-pixel-accent-green"
                      : "text-pixel-text-secondary hover:text-pixel-accent-green"
                  }`}
                >
                  Subscribers
                </Link>
                <Link
                  href="/admin/deployments"
                  className={`font-pixel text-pixel-xs uppercase transition-colors ${
                    pathname === "/admin/deployments"
                      ? "text-pixel-accent-green"
                      : "text-pixel-text-secondary hover:text-pixel-accent-green"
                  }`}
                >
                  Deployments
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/" className="font-mono text-sm text-pixel-text-muted hover:text-pixel-text-secondary">
                View Site
              </Link>
              <PixelButton size="sm" variant="secondary" onClick={handleLogout}>
                Logout
              </PixelButton>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
