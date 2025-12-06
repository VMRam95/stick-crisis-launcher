import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated, verifyApiKey } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { sendNewsletterEmail } from "@/lib/email/emailjs";

async function isAuthorized(): Promise<boolean> {
  const cookieAuth = await isAdminAuthenticated();
  if (cookieAuth) return true;

  const apiKeyAuth = await verifyApiKey();
  return apiKeyAuth;
}

// GET - List all changelogs (including unpublished)
export async function GET() {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseServer
      .from("changelog")
      .select("*")
      .order("release_date", { ascending: false });

    if (error) {
      console.error("Error fetching changelogs:", error);
      return NextResponse.json(
        { error: "Failed to fetch changelogs" },
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

// POST - Create changelog
export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { version, title, content, category, release_date, is_published, notify_subscribers } =
      body;

    if (!version || !title || !content) {
      return NextResponse.json(
        { error: "Version, title, and content are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("changelog")
      .insert([
        {
          version,
          title,
          content,
          category: category || "Feature",
          release_date: release_date || new Date().toISOString().split("T")[0],
          is_published: is_published ?? false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating changelog:", error);
      return NextResponse.json(
        { error: "Failed to create changelog" },
        { status: 500 }
      );
    }

    // Send notification emails if requested and changelog is published
    let notificationResult = { sent: 0, errors: 0 };
    if (notify_subscribers && is_published) {
      notificationResult = await notifySubscribers(data.version, data.title, data.content);
    }

    return NextResponse.json({
      data,
      notification: notify_subscribers ? notificationResult : undefined
    }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to notify subscribers
async function notifySubscribers(version: string, title: string, content: string) {
  try {
    const { data: subscribers, error: fetchError } = await supabaseServer
      .from("newsletter_subscribers")
      .select("email, unsubscribe_token")
      .eq("is_active", true);

    if (fetchError || !subscribers || subscribers.length === 0) {
      console.log("No subscribers to notify");
      return { sent: 0, errors: 0 };
    }

    let sent = 0;
    let errors = 0;
    const subject = `Stick Crisis ${version} - ${title}`;

    for (const subscriber of subscribers) {
      try {
        await sendNewsletterEmail(
          subscriber.email,
          subject,
          content,
          subscriber.unsubscribe_token
        );
        sent++;
      } catch (err) {
        console.error(`Failed to notify ${subscriber.email}:`, err);
        errors++;
      }
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Log the notification
    await supabaseServer.from("email_logs").insert([{
      subject,
      recipient_count: sent,
      status: errors > 0 ? "partial" : "sent",
    }]);

    return { sent, errors };
  } catch (error) {
    console.error("Error notifying subscribers:", error);
    return { sent: 0, errors: -1 };
  }
}

// PUT - Update changelog
export async function PUT(request: NextRequest) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, version, title, content, category, release_date, is_published } =
      body;

    if (!id) {
      return NextResponse.json(
        { error: "Changelog ID is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (version !== undefined) updateData.version = version;
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (release_date !== undefined) updateData.release_date = release_date;
    if (is_published !== undefined) updateData.is_published = is_published;

    const { data, error } = await supabaseServer
      .from("changelog")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating changelog:", error);
      return NextResponse.json(
        { error: "Failed to update changelog" },
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

// DELETE - Delete changelog
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Changelog ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from("changelog")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting changelog:", error);
      return NextResponse.json(
        { error: "Failed to delete changelog" },
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
