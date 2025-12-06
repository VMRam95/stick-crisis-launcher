import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const isAuthenticated = await isAdminAuthenticated();
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get changelog stats
    const { count: totalChangelogs } = await supabaseServer
      .from("changelog")
      .select("*", { count: "exact", head: true });

    const { count: publishedChangelogs } = await supabaseServer
      .from("changelog")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true);

    // Get subscriber stats
    const { count: totalSubscribers } = await supabaseServer
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true });

    const { count: activeSubscribers } = await supabaseServer
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    return NextResponse.json({
      totalChangelogs: totalChangelogs || 0,
      publishedChangelogs: publishedChangelogs || 0,
      totalSubscribers: totalSubscribers || 0,
      activeSubscribers: activeSubscribers || 0,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
