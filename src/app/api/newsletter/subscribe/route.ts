import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/emailjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const { data: existing } = await supabaseServer
      .from("newsletter_subscribers")
      .select("id, is_active")
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json(
          { error: "Email already subscribed" },
          { status: 409 }
        );
      }

      // Reactivate subscription and get unsubscribe_token
      const { data: reactivated, error: updateError } = await supabaseServer
        .from("newsletter_subscribers")
        .update({ is_active: true })
        .eq("id", existing.id)
        .select("unsubscribe_token")
        .single();

      if (updateError) {
        console.error("Error reactivating subscription:", updateError);
        return NextResponse.json(
          { error: "Failed to reactivate subscription" },
          { status: 500 }
        );
      }

      // Send welcome back email via EmailJS (non-blocking)
      try {
        await sendWelcomeEmail(email.toLowerCase(), reactivated.unsubscribe_token);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail the subscription if email fails
      }

      return NextResponse.json({
        success: true,
        message: "Welcome back! Your subscription has been reactivated.",
      });
    }

    // Create new subscription
    const { data, error } = await supabaseServer
      .from("newsletter_subscribers")
      .insert([{ email: email.toLowerCase() }])
      .select("id, unsubscribe_token")
      .single();

    if (error) {
      console.error("Error creating subscription:", error);
      return NextResponse.json(
        { error: "Failed to subscribe" },
        { status: 500 }
      );
    }

    // Send welcome email via EmailJS (non-blocking)
    try {
      await sendWelcomeEmail(email.toLowerCase(), data.unsubscribe_token);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the subscription if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed!",
      data: { id: data.id },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
