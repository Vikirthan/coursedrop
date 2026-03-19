type PasswordResetOtpEmailInput = {
  toEmail: string;
  recipientName?: string | null;
  otp: string;
  expiresInMinutes?: number;
};

type EmailRuntimeConfig = {
  apiKey: string;
  fromEmail: string;
  appName: string;
};

function getEmailRuntimeConfig(): EmailRuntimeConfig {
  const apiKey = (process.env.RESEND_API_KEY ?? "").trim();
  const fromEmail = (
    process.env.RESEND_FROM_EMAIL ?? process.env.EMAIL_FROM ?? ""
  ).trim();
  const appName = (process.env.APP_NAME ?? "CourseDrop").trim() || "CourseDrop";

  const missing: string[] = [];
  if (!apiKey) {
    missing.push("RESEND_API_KEY");
  }
  if (!fromEmail) {
    missing.push("RESEND_FROM_EMAIL (or EMAIL_FROM)");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing email configuration: ${missing.join(
        ", "
      )}. Set these in your hosting dashboard and redeploy.`
    );
  }

  return { apiKey, fromEmail, appName };
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildResetEmailHtml(params: {
  appName: string;
  recipientName?: string | null;
  otp: string;
  expiresInMinutes: number;
}): string {
  const safeApp = escapeHtml(params.appName);
  const safeOtp = escapeHtml(params.otp);
  const greeting = params.recipientName?.trim()
    ? `Hello ${escapeHtml(params.recipientName.trim())},`
    : "Hello,";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
      <h2 style="margin: 0 0 16px; color: #1e293b;">${safeApp} Password Reset</h2>
      <p style="margin: 0 0 12px;">${greeting}</p>
      <p style="margin: 0 0 16px;">Use this one-time password (OTP) to reset your password:</p>
      <div style="font-size: 32px; letter-spacing: 6px; font-weight: 700; text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin: 0 0 16px;">
        ${safeOtp}
      </div>
      <p style="margin: 0 0 8px;">This OTP expires in ${params.expiresInMinutes} minutes.</p>
      <p style="margin: 0 0 0; color: #475569; font-size: 13px;">
        If you did not request this change, you can safely ignore this email.
      </p>
    </div>
  `;
}

function buildResetEmailText(params: {
  appName: string;
  recipientName?: string | null;
  otp: string;
  expiresInMinutes: number;
}): string {
  const greeting = params.recipientName?.trim()
    ? `Hello ${params.recipientName.trim()},`
    : "Hello,";

  return [
    `${params.appName} Password Reset`,
    "",
    greeting,
    "",
    `Your OTP is: ${params.otp}`,
    `This OTP expires in ${params.expiresInMinutes} minutes.`,
    "",
    "If you did not request this change, ignore this email.",
  ].join("\n");
}

export async function sendPasswordResetOtpEmail(
  input: PasswordResetOtpEmailInput
): Promise<void> {
  const config = getEmailRuntimeConfig();
  const expiresInMinutes = input.expiresInMinutes ?? 10;

  const payload = {
    from: config.fromEmail,
    to: [input.toEmail],
    subject: `${config.appName} password reset OTP`,
    html: buildResetEmailHtml({
      appName: config.appName,
      recipientName: input.recipientName,
      otp: input.otp,
      expiresInMinutes,
    }),
    text: buildResetEmailText({
      appName: config.appName,
      recipientName: input.recipientName,
      otp: input.otp,
      expiresInMinutes,
    }),
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Failed to send OTP email (${res.status} ${res.statusText}). ${body}`
    );
  }
}
