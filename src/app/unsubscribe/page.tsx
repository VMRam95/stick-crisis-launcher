"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PixelButton, PixelCard, LoadingSpinner } from "@/components/ui";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No unsubscribe token provided");
      return;
    }

    async function unsubscribe() {
      try {
        const response = await fetch(
          `/api/newsletter/unsubscribe?token=${token}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to unsubscribe");
        }

        setStatus("success");
        setMessage(data.message);
        setEmail(data.email || "");
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Failed to unsubscribe");
      }
    }

    unsubscribe();
  }, [token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <PixelCard className="max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="font-mono text-pixel-text-secondary">
              Processing your request...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-4xl mb-4">✓</div>
            <h1 className="font-pixel text-pixel-sm text-pixel-accent-green uppercase mb-4">
              Unsubscribed
            </h1>
            <p className="font-mono text-pixel-text-secondary mb-2">
              {message}
            </p>
            {email && (
              <p className="font-mono text-pixel-text-muted text-sm mb-6">
                ({email})
              </p>
            )}
            <p className="font-mono text-pixel-text-muted text-sm mb-6">
              We&apos;re sorry to see you go. You can always resubscribe from
              our homepage.
            </p>
            <Link href="/">
              <PixelButton>Back to Home</PixelButton>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-4xl mb-4">✗</div>
            <h1 className="font-pixel text-pixel-sm text-pixel-accent-red uppercase mb-4">
              Error
            </h1>
            <p className="font-mono text-pixel-text-secondary mb-6">
              {message}
            </p>
            <Link href="/">
              <PixelButton variant="secondary">Back to Home</PixelButton>
            </Link>
          </>
        )}
      </PixelCard>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
