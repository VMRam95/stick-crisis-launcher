import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  request: Request,
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

    // Get deployment by ID
    const { data, error } = await supabaseServer
      .from("deployments")
      .select("*")
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

    // If deployment has a changelog_id, fetch the changelog too
    let changelog = null;
    if (data.changelog_id) {
      const { data: changelogData } = await supabaseServer
        .from("changelog")
        .select("*")
        .eq("id", data.changelog_id)
        .single();
      changelog = changelogData;
    }

    return NextResponse.json({
      data: {
        ...data,
        changelog,
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
