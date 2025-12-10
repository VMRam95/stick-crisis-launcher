import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";

// Check if running on Vercel (serverless) or locally
function isRunningLocally(): boolean {
  // VERCEL env var is automatically set to "1" on Vercel deployments
  return process.env.VERCEL !== "1";
}

// GET - Check deployment environment capabilities
export async function GET() {
  try {
    const isAuthenticated = await isAdminAuthenticated();
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isLocal = isRunningLocally();

    return NextResponse.json({
      isLocal,
      canExecuteDeployments: isLocal,
      canAccessBuilds: isLocal,
      environment: isLocal ? "local" : "vercel",
      message: isLocal
        ? "Running locally - full deployment capabilities available"
        : "Running on Vercel - deployment execution disabled (use local environment)",
    });
  } catch (error) {
    console.error("Environment check error:", error);
    return NextResponse.json(
      { error: "Failed to check environment" },
      { status: 500 }
    );
  }
}
