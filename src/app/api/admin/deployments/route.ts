import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated, verifyApiKey } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

async function isAuthorized(): Promise<boolean> {
  const cookieAuth = await isAdminAuthenticated();
  if (cookieAuth) return true;

  const apiKeyAuth = await verifyApiKey();
  return apiKeyAuth;
}

// GET - List all deployments
export async function GET(request: NextRequest) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const latest = searchParams.get("latest") === "true";
    const detailed = searchParams.get("detailed") === "true";

    // Determine select query based on detailed flag
    const selectQuery = detailed
      ? `
        *,
        changelog:changelog_id (
          id,
          version,
          title,
          content,
          category,
          release_date,
          is_published
        )
      `
      : "*";

    if (latest) {
      // Get only the latest deployment
      const { data, error } = await supabaseServer
        .from("deployments")
        .select(selectQuery)
        .order("deployed_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching latest deployment:", error);
        return NextResponse.json(
          { error: "Failed to fetch latest deployment" },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: data || null });
    }

    // Get paginated list
    const { data, error, count } = await supabaseServer
      .from("deployments")
      .select(selectQuery, { count: "exact" })
      .order("deployed_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching deployments:", error);
      return NextResponse.json(
        { error: "Failed to fetch deployments" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Report new deployment (called by distribute_itch.sh)
export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      version,
      platforms,
      status = "completed",
      build_info = {},
      itch_channels = [],
      commit_hash,
      commit_message,
    } = body;

    if (!version || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: "Version and platforms are required" },
        { status: 400 }
      );
    }

    // Try to find matching changelog
    let changelog_id = null;
    const { data: changelog } = await supabaseServer
      .from("changelog")
      .select("id")
      .eq("version", version)
      .single();

    if (changelog) {
      changelog_id = changelog.id;
    }

    const { data, error } = await supabaseServer
      .from("deployments")
      .insert([
        {
          version,
          platforms,
          status,
          build_info,
          changelog_id,
          itch_channels,
          commit_hash,
          commit_message,
          deployed_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating deployment:", error);
      return NextResponse.json(
        { error: "Failed to create deployment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete deployment
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Deployment ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from("deployments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting deployment:", error);
      return NextResponse.json(
        { error: "Failed to delete deployment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
