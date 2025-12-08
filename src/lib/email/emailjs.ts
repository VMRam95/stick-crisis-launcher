// EmailJS Server-side API integration
// Uses EmailJS REST API for server-side email sending

interface EmailJSResponse {
  status: number;
  text: string;
}

interface SendEmailParams {
  to_email: string;
  to_name?: string;
  subject: string;
  message: string;
  unsubscribe_url?: string;
  version?: string;
  download_url?: string;
  changelog_url?: string;
}

const EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send";

export async function sendEmail(
  templateId: string,
  params: SendEmailParams
): Promise<EmailJSResponse> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !publicKey) {
    throw new Error("EmailJS credentials not configured");
  }

  const response = await fetch(EMAILJS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: params,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`EmailJS error: ${text}`);
  }

  return {
    status: response.status,
    text: await response.text(),
  };
}

export async function sendWelcomeEmail(
  email: string,
  unsubscribeToken: string
): Promise<void> {
  const templateId = process.env.EMAILJS_WELCOME_TEMPLATE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!templateId) {
    console.warn("Welcome email template not configured, skipping...");
    return;
  }

  await sendEmail(templateId, {
    to_email: email,
    subject: "Welcome to Stick Crisis Newsletter!",
    message: "Thanks for subscribing! You'll receive updates about new features, releases, and more.",
    unsubscribe_url: `${appUrl}/unsubscribe?token=${unsubscribeToken}`,
  });
}

export async function sendNewsletterEmail(
  email: string,
  subject: string,
  content: string,
  unsubscribeToken: string
): Promise<void> {
  const templateId = process.env.EMAILJS_NEWSLETTER_TEMPLATE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!templateId) {
    throw new Error("Newsletter email template not configured");
  }

  await sendEmail(templateId, {
    to_email: email,
    subject,
    message: content,
    unsubscribe_url: `${appUrl}/unsubscribe?token=${unsubscribeToken}`,
  });
}

export async function sendDeploymentEmail(
  email: string,
  version: string,
  changelog: string,
  unsubscribeToken: string
): Promise<void> {
  const templateId = process.env.EMAILJS_DEPLOYMENT_TEMPLATE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const itchUrl = process.env.NEXT_PUBLIC_ITCH_URL || "https://vmram95.itch.io/stick-crisis";

  if (!templateId) {
    throw new Error("Deployment email template not configured");
  }

  await sendEmail(templateId, {
    to_email: email,
    subject: `🎮 Stick Crisis ${version} Released!`,
    message: changelog,
    version: version,
    download_url: itchUrl,
    changelog_url: `${appUrl}/changelog`,
    unsubscribe_url: `${appUrl}/unsubscribe?token=${unsubscribeToken}`,
  });
}
