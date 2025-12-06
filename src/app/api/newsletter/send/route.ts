import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { sendNewsletterEmail } from "@/lib/email/emailjs";

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAuthenticated = await isAdminAuthenticated();
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, content } = body;

    if (!subject || !content) {
      return NextResponse.json(
        { error: "Subject and content are required" },
        { status: 400 }
      );
    }

    // Get all active subscribers
    const { data: subscribers, error: fetchError } = await supabaseServer
      .from("newsletter_subscribers")
      .select("email, unsubscribe_token")
      .eq("is_active", true);

    if (fetchError) {
      console.error("Error fetching subscribers:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch subscribers" },
        { status: 500 }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: "No active subscribers" },
        { status: 400 }
      );
    }

    // Send emails to all subscribers
    let sentCount = 0;
    const errors: string[] = [];

    for (const subscriber of subscribers) {
      try {
        await sendNewsletterEmail(
          subscriber.email,
          subject,
          content,
          subscriber.unsubscribe_token
        );
        sentCount++;
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error);
        errors.push(subscriber.email);
      }

      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Log the email send
    await supabaseServer.from("email_logs").insert([
      {
        subject,
        content,
        recipient_count: sentCount,
        status: errors.length > 0 ? "partial" : "sent",
      },
    ]);

    return NextResponse.json({
      success: true,
      sentCount,
      totalSubscribers: subscribers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Send newsletter error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
