import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// GET - Fetch single deployment with full changelog
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Deployment ID is required" },
        { status: 400 }
      );
    }

    // Fetch deployment with full changelog data
    const { data, error } = await supabaseServer
      .from("deployments")
      .select(
        `
        *,
        changelog:changelog_id (
          id,
          version,
          title,
          content,
          category,
          release_date,
          is_published,
          created_at,
          updated_at
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Deployment not found" },
          { status: 404 }
        );
      }

      console.error("Error fetching deployment:", error);
      return NextResponse.json(
        { error: "Failed to fetch deployment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
