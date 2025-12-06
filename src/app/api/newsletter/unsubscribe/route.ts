import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Unsubscribe token is required" },
        { status: 400 }
      );
    }

    // Find subscriber by token
    const { data: subscriber } = await supabaseServer
      .from("newsletter_subscribers")
      .select("id, is_active")
      .eq("unsubscribe_token", token)
      .single();

    if (!subscriber) {
      return NextResponse.json(
        { error: "Invalid unsubscribe token" },
        { status: 404 }
      );
    }

    if (!subscriber.is_active) {
      return NextResponse.json({
        success: true,
        message: "Already unsubscribed",
      });
    }

    // Deactivate subscription
    const { error } = await supabaseServer
      .from("newsletter_subscribers")
      .update({ is_active: false })
      .eq("id", subscriber.id);

    if (error) {
      console.error("Error unsubscribing:", error);
      return NextResponse.json(
        { error: "Failed to unsubscribe" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully unsubscribed",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support GET for unsubscribe links in emails
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Unsubscribe token is required" },
      { status: 400 }
    );
  }

  // Find subscriber by token
  const { data: subscriber } = await supabaseServer
    .from("newsletter_subscribers")
    .select("id, is_active, email")
    .eq("unsubscribe_token", token)
    .single();

  if (!subscriber) {
    return NextResponse.json(
      { error: "Invalid unsubscribe token" },
      { status: 404 }
    );
  }

  if (!subscriber.is_active) {
    return NextResponse.json({
      success: true,
      message: "Already unsubscribed",
      email: subscriber.email,
    });
  }

  // Deactivate subscription
  const { error } = await supabaseServer
    .from("newsletter_subscribers")
    .update({ is_active: false })
    .eq("id", subscriber.id);

  if (error) {
    console.error("Error unsubscribing:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Successfully unsubscribed",
    email: subscriber.email,
  });
}
