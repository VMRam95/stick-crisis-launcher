import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// GET - Fetch single changelog by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Changelog ID is required" },
        { status: 400 }
      );
    }

    // Fetch changelog by ID (only published ones for public access)
    const { data, error } = await supabaseServer
      .from("changelog")
      .select("*")
      .eq("id", id)
      .eq("is_published", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Changelog not found" },
          { status: 404 }
        );
      }

      console.error("Error fetching changelog:", error);
      return NextResponse.json(
        { error: "Failed to fetch changelog" },
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
