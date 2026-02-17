import nodemailer from "nodemailer";

// Email configuration - supports any SMTP provider
// Set these env vars on Railway:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
// Examples:
//   Gmail: smtp.gmail.com, 587, your@gmail.com, app-password
//   Brevo: smtp-relay.brevo.com, 587, your-login, your-key
//   Zoho:  smtp.zoho.com, 587, info@vipatebllokut.com, password

const RECIPIENT_EMAIL = "info@vipatebllokut.com";
const FALLBACK_EMAIL = "khanmehroza35@gmail.com";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("[Email] SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS env vars.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  reason: string;
  subject?: string;
  message: string;
  budget?: string;
}

export async function sendContactEmail(data: ContactFormData): Promise<{ success: boolean; error?: string }> {
  const transporter = getTransporter();

  if (!transporter) {
    // If SMTP is not configured, log the submission and return success
    // This ensures the form works even without email configured
    console.log("[Email] SMTP not configured. Form submission logged:");
    console.log(JSON.stringify(data, null, 2));
    return { success: true };
  }

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@vipatebllokut.com";

  // Build a nicely formatted HTML email
  const reasonLabels: Record<string, string> = {
    general: "General Enquiry",
    editorial: "Editorial / News Tips",
    advertising: "Advertising & Partnerships",
    marketing: "Marketing Collaboration",
    press: "Press & Media Enquiries",
    legal: "Legal / Compliance",
    technical: "Technical Support",
    careers: "Careers & Freelancing",
  };

  const reasonLabel = reasonLabels[data.reason] || data.reason;
  const emailSubject = data.subject
    ? `[${reasonLabel}] ${data.subject}`
    : `[${reasonLabel}] New message from ${data.name}`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #d4a843; margin: 0; font-size: 20px;">Vipat E Bllokut</h1>
        <p style="color: #ffffff99; margin: 4px 0 0; font-size: 13px;">New Contact Form Submission</p>
      </div>
      <div style="background: #f8f9fa; padding: 24px; border: 1px solid #e9ecef; border-top: none;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #333; width: 140px; vertical-align: top;">Department:</td>
            <td style="padding: 8px 12px; color: #555;">${reasonLabel}</td>
          </tr>
          <tr style="background: #fff;">
            <td style="padding: 8px 12px; font-weight: bold; color: #333; vertical-align: top;">Name:</td>
            <td style="padding: 8px 12px; color: #555;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #333; vertical-align: top;">Email:</td>
            <td style="padding: 8px 12px; color: #555;"><a href="mailto:${data.email}" style="color: #d4a843;">${data.email}</a></td>
          </tr>
          ${data.phone ? `<tr style="background: #fff;"><td style="padding: 8px 12px; font-weight: bold; color: #333; vertical-align: top;">Phone:</td><td style="padding: 8px 12px; color: #555;">${data.phone}</td></tr>` : ""}
          ${data.company ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #333; vertical-align: top;">Company:</td><td style="padding: 8px 12px; color: #555;">${data.company}</td></tr>` : ""}
          ${data.budget ? `<tr style="background: #fff;"><td style="padding: 8px 12px; font-weight: bold; color: #333; vertical-align: top;">Budget:</td><td style="padding: 8px 12px; color: #555;">${data.budget}</td></tr>` : ""}
          ${data.subject ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #333; vertical-align: top;">Subject:</td><td style="padding: 8px 12px; color: #555;">${data.subject}</td></tr>` : ""}
        </table>
        <div style="margin-top: 16px; padding: 16px; background: #fff; border-radius: 8px; border: 1px solid #e9ecef;">
          <p style="font-weight: bold; color: #333; margin: 0 0 8px;">Message:</p>
          <p style="color: #555; line-height: 1.6; margin: 0; white-space: pre-wrap;">${data.message}</p>
        </div>
      </div>
      <div style="background: #1a1a2e; padding: 16px 24px; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="color: #ffffff66; font-size: 11px; margin: 0;">
          This email was sent from the contact form at vipatebllokut.com<br>
          Reply directly to this email to respond to ${data.name}.
        </p>
      </div>
    </div>
  `;

  const textBody = `
New Contact Form Submission - Vipat E Bllokut
================================================
Department: ${reasonLabel}
Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}\n` : ""}${data.company ? `Company: ${data.company}\n` : ""}${data.budget ? `Budget: ${data.budget}\n` : ""}${data.subject ? `Subject: ${data.subject}\n` : ""}
Message:
${data.message}
================================================
Sent from vipatebllokut.com contact form
  `.trim();

  try {
    await transporter.sendMail({
      from: `"Vipat E Bllokut" <${fromAddress}>`,
      to: RECIPIENT_EMAIL,
      cc: (RECIPIENT_EMAIL as string) !== (FALLBACK_EMAIL as string) ? FALLBACK_EMAIL : undefined,
      replyTo: `"${data.name}" <${data.email}>`,
      subject: emailSubject,
      text: textBody,
      html: htmlBody,
    });

    console.log(`[Email] Sent contact form email from ${data.name} (${data.email}) - ${reasonLabel}`);
    return { success: true };
  } catch (error: any) {
    console.error("[Email] Failed to send:", error.message || error);
    return { success: false, error: error.message || "Failed to send email" };
  }
}

interface NewsletterData {
  email: string;
}

export async function sendNewsletterConfirmation(data: NewsletterData): Promise<{ success: boolean; error?: string }> {
  // Log newsletter subscription
  console.log(`[Newsletter] New subscription: ${data.email}`);

  const transporter = getTransporter();
  if (!transporter) {
    return { success: true };
  }

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@vipatebllokut.com";

  try {
    // Notify the admin about new subscriber
    await transporter.sendMail({
      from: `"Vipat E Bllokut" <${fromAddress}>`,
      to: RECIPIENT_EMAIL,
      subject: `[Newsletter] New subscriber: ${data.email}`,
      text: `New newsletter subscription from: ${data.email}\n\nSent from vipatebllokut.com`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #d4a843;">New Newsletter Subscriber</h2>
          <p>Email: <strong>${data.email}</strong></p>
          <p style="color: #999; font-size: 12px;">Sent from vipatebllokut.com</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error: any) {
    console.error("[Email] Failed to send newsletter notification:", error.message || error);
    return { success: false, error: error.message || "Failed to send" };
  }
}
