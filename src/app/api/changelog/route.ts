import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("changelog")
      .select("*")
      .eq("is_published", true)
      .order("release_date", { ascending: false })
      .limit(10);

    if (error) {
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
