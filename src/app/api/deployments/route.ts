import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    // Parse pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Validate parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 50); // Max 50 items per page

    // Calculate offset
    const offset = (validPage - 1) * validLimit;

    // Get total count
    const { count, error: countError } = await supabaseServer
      .from("deployments")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error counting deployments:", countError);
      return NextResponse.json(
        { error: "Failed to fetch deployment count" },
        { status: 500 }
      );
    }

    // Get paginated data - sorted by deployed_at DESC
    const { data, error } = await supabaseServer
      .from("deployments")
      .select("*")
      .order("deployed_at", { ascending: false })
      .range(offset, offset + validLimit - 1);

    if (error) {
      console.error("Error fetching deployments:", error);
      return NextResponse.json(
        { error: "Failed to fetch deployments" },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / validLimit);

    return NextResponse.json({
      data,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages,
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
