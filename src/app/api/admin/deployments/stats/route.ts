import { NextResponse } from "next/server";
import { isAdminAuthenticated, verifyApiKey } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

async function isAuthorized(): Promise<boolean> {
  const cookieAuth = await isAdminAuthenticated();
  if (cookieAuth) return true;

  const apiKeyAuth = await verifyApiKey();
  return apiKeyAuth;
}

// GET - Get deployment statistics
export async function GET() {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get total count
    const { count: totalDeployments } = await supabaseServer
      .from("deployments")
      .select("*", { count: "exact", head: true });

    // Get latest deployment
    const { data: latest } = await supabaseServer
      .from("deployments")
      .select("version, deployed_at, platforms, build_info, itch_channels")
      .order("deployed_at", { ascending: false })
      .limit(1)
      .single();

    // Get all deployments to calculate platform counts
    const { data: allDeployments } = await supabaseServer
      .from("deployments")
      .select("platforms");

    let macCount = 0;
    let windowsCount = 0;

    if (allDeployments) {
      for (const dep of allDeployments) {
        if (dep.platforms?.includes("mac")) macCount++;
        if (dep.platforms?.includes("windows")) windowsCount++;
      }
    }

    // Get recent deployments (last 5)
    const { data: recentDeployments } = await supabaseServer
      .from("deployments")
      .select("id, version, platforms, status, build_info, deployed_at")
      .order("deployed_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      data: {
        totalDeployments: totalDeployments || 0,
        latestVersion: latest?.version || "N/A",
        lastDeployedAt: latest?.deployed_at || null,
        latestBuildInfo: latest?.build_info || {},
        latestPlatforms: latest?.platforms || [],
        latestChannels: latest?.itch_channels || [],
        platformCounts: {
          mac: macCount,
          windows: windowsCount,
        },
        recentDeployments: recentDeployments || [],
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
