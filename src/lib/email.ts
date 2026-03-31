type PasswordResetOtpEmailInput = {
  toEmail: string;
  recipientName?: string | null;
  otp: string;
  expiresInMinutes?: number;
};

type TeacherApprovalStatusEmailInput = {
  toEmail: string;
  recipientName?: string | null;
  approved: boolean;
};

type SubjectRequestStatusEmailInput = {
  toEmail: string;
  recipientName?: string | null;
  subjectName: string;
  courseCode: string;
  approved: boolean;
};

type CourseSharingNotificationEmailInput = {
  toEmail: string;
  recipientName?: string | null;
  courseCode: string;
  ownerName?: string | null;
  sharedWithName?: string | null;
  audience: "owner" | "recipient";
};

type EmailRuntimeConfig = {
  apiKey: string;
  fromEmail: string;
  appName: string;
  appUrl: string;
};

type ResendErrorBody = {
  statusCode?: number;
  message?: string;
  name?: string;
};

function getEmailRuntimeConfig(): EmailRuntimeConfig {
  const apiKey = (process.env.RESEND_API_KEY ?? "").trim();
  const fromEmail = (
    process.env.RESEND_FROM_EMAIL ?? process.env.EMAIL_FROM ?? ""
  ).trim();
  const appName = (process.env.APP_NAME ?? "CourseDrop").trim() || "CourseDrop";
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://coursedrop.vercel.app")
  )
    .trim()
    .replace(/\/+$/, "");

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

  return { apiKey, fromEmail, appName, appUrl };
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildEmailShell(params: {
  appName: string;
  appUrl: string;
  title: string;
  bodyHtml: string;
}): string {
  const safeApp = escapeHtml(params.appName);
  const safeTitle = escapeHtml(params.title);
  const logoUrl = `${params.appUrl}/icon-192.png`;

  return `
    <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 24px 12px; color: #0f172a;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
        <div style="padding: 18px 20px; border-bottom: 1px solid #e2e8f0; background: #eef2ff;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${logoUrl}" alt="${safeApp} logo" width="36" height="36" style="display: block; border-radius: 8px;" />
            <div>
              <p style="margin: 0; font-size: 16px; font-weight: 700; color: #1e293b;">${safeApp}</p>
              <p style="margin: 2px 0 0; font-size: 12px; color: #475569;">Official Notification</p>
            </div>
          </div>
        </div>
        <div style="padding: 20px;">
          <h2 style="margin: 0 0 14px; font-size: 20px; color: #0f172a;">${safeTitle}</h2>
          ${params.bodyHtml}
        </div>
      </div>
    </div>
  `;
}

function buildResetEmailHtml(params: {
  appName: string;
  appUrl: string;
  recipientName?: string | null;
  otp: string;
  expiresInMinutes: number;
}): string {
  const safeOtp = escapeHtml(params.otp);
  const greeting = params.recipientName?.trim()
    ? `Hello ${escapeHtml(params.recipientName.trim())},`
    : "Hello,";

  return buildEmailShell({
    appName: params.appName,
    appUrl: params.appUrl,
    title: "Password Reset Verification",
    bodyHtml: `
      <p style="margin: 0 0 12px;">${greeting}</p>
      <p style="margin: 0 0 16px;">Please use the following one-time password (OTP) to reset your account password:</p>
      <div style="font-size: 32px; letter-spacing: 6px; font-weight: 700; text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin: 0 0 16px;">
        ${safeOtp}
      </div>
      <p style="margin: 0 0 8px;">This OTP will expire in ${params.expiresInMinutes} minutes.</p>
      <p style="margin: 0 0 0; color: #475569; font-size: 13px;">
        If you did not initiate this request, please disregard this email.
      </p>
    `,
  });
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
      appUrl: config.appUrl,
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
    const raw = await res.text();
    let parsed: ResendErrorBody | null = null;

    try {
      parsed = JSON.parse(raw) as ResendErrorBody;
    } catch {
      parsed = null;
    }

    const providerMessage = (parsed?.message ?? raw).trim();

    if (
      res.status === 403 &&
      providerMessage.toLowerCase().includes("domain") &&
      providerMessage.toLowerCase().includes("not verified")
    ) {
      throw new Error(
        "OTP email is blocked because the sender domain is not verified in Resend. Set RESEND_FROM_EMAIL to an address on a verified domain in Resend (or use onboarding@resend.dev for testing) and redeploy."
      );
    }

    throw new Error(
      `Failed to send OTP email (${res.status} ${res.statusText}). ${providerMessage}`
    );
  }
}

function buildTeacherApprovalEmailHtml(params: {
  appName: string;
  appUrl: string;
  recipientName?: string | null;
  approved: boolean;
}): string {
  const greeting = params.recipientName?.trim()
    ? `Hello ${escapeHtml(params.recipientName.trim())},`
    : "Hello,";
  const title = params.approved
    ? "Teacher/CR Account Approval Confirmation"
    : "Teacher/CR Access Status Update";
  const body = params.approved
    ? "Your Teacher/CR account has been approved. You may now sign in to CourseDrop and access the portal features assigned to your role."
    : "This is to inform you that your Teacher/CR access has been revoked by the administrator. If you require clarification, please contact the administration team.";

  return buildEmailShell({
    appName: params.appName,
    appUrl: params.appUrl,
    title,
    bodyHtml: `
      <p style="margin: 0 0 12px;">${greeting}</p>
      <p style="margin: 0 0 0;">${escapeHtml(body)}</p>
    `,
  });
}

function buildTeacherApprovalEmailText(params: {
  appName: string;
  recipientName?: string | null;
  approved: boolean;
}): string {
  const greeting = params.recipientName?.trim()
    ? `Hello ${params.recipientName.trim()},`
    : "Hello,";

  return [
    `${params.appName} - Account Status Notification`,
    "",
    greeting,
    "",
    params.approved
      ? "Your Teacher/CR account has been approved. You may now sign in and access the portal."
      : "Your Teacher/CR access has been revoked by the administrator.",
    "",
    "If you need assistance, please contact the administration team.",
  ].join("\n");
}

function buildSubjectRequestStatusHtml(params: {
  appName: string;
  appUrl: string;
  recipientName?: string | null;
  subjectName: string;
  courseCode: string;
  approved: boolean;
}): string {
  const greeting = params.recipientName?.trim()
    ? `Hello ${escapeHtml(params.recipientName.trim())},`
    : "Hello,";
  const statusText = params.approved ? "Approved" : "Rejected";
  const nextText = params.approved
    ? "Your subject/folder request has been approved by the administrator. You may proceed with the next steps in the portal."
    : "Your subject/folder request has been rejected by the administrator. You may submit a revised request if required.";

  return buildEmailShell({
    appName: params.appName,
    appUrl: params.appUrl,
    title: "Subject/Folder Request Status Update",
    bodyHtml: `
      <p style="margin: 0 0 12px;">${greeting}</p>
      <p style="margin: 0 0 8px;"><strong>Subject:</strong> ${escapeHtml(params.subjectName)}</p>
      <p style="margin: 0 0 8px;"><strong>Course Code:</strong> ${escapeHtml(params.courseCode)}</p>
      <p style="margin: 0 0 12px;"><strong>Status:</strong> ${escapeHtml(statusText)}</p>
      <p style="margin: 0;">${escapeHtml(nextText)}</p>
    `,
  });
}

function buildSubjectRequestStatusText(params: {
  appName: string;
  recipientName?: string | null;
  subjectName: string;
  courseCode: string;
  approved: boolean;
}): string {
  const greeting = params.recipientName?.trim()
    ? `Hello ${params.recipientName.trim()},`
    : "Hello,";
  const statusText = params.approved ? "Approved" : "Rejected";

  return [
    `${params.appName} Subject Request Update`,
    "",
    greeting,
    "",
    `Subject: ${params.subjectName}`,
    `Course Code: ${params.courseCode}`,
    `Status: ${statusText}`,
    "",
    params.approved
      ? "Your subject/folder request has been approved by the administrator."
      : "Your subject/folder request has been rejected by the administrator.",
    "",
    "Please contact the administration team if you need further clarification.",
  ].join("\n");
}

function buildCourseSharingNotificationHtml(params: {
  appName: string;
  appUrl: string;
  recipientName?: string | null;
  courseCode: string;
  ownerName?: string | null;
  sharedWithName?: string | null;
  audience: "owner" | "recipient";
}): string {
  const greeting = params.recipientName?.trim()
    ? `Hello ${escapeHtml(params.recipientName.trim())},`
    : "Hello,";

  const title =
    params.audience === "owner"
      ? "Course Folder Sharing Update"
      : "New Course Folder Sharing Access";

  const ownerText = params.ownerName?.trim()
    ? escapeHtml(params.ownerName.trim())
    : "the folder owner";
  const recipientText = params.sharedWithName?.trim()
    ? escapeHtml(params.sharedWithName.trim())
    : "a teacher";

  const body =
    params.audience === "owner"
      ? `Sharing access for course <strong>${escapeHtml(params.courseCode)}</strong> has been granted to <strong>${recipientText}</strong>.`
      : `You have been granted sharing access to the course folder <strong>${escapeHtml(params.courseCode)}</strong>, owned by <strong>${ownerText}</strong>.`;

  return buildEmailShell({
    appName: params.appName,
    appUrl: params.appUrl,
    title,
    bodyHtml: `
      <p style="margin: 0 0 12px;">${greeting}</p>
      <p style="margin: 0;">${body}</p>
    `,
  });
}

function buildCourseSharingNotificationText(params: {
  appName: string;
  recipientName?: string | null;
  courseCode: string;
  ownerName?: string | null;
  sharedWithName?: string | null;
  audience: "owner" | "recipient";
}): string {
  const greeting = params.recipientName?.trim()
    ? `Hello ${params.recipientName.trim()},`
    : "Hello,";

  const ownerText = params.ownerName?.trim() || "the folder owner";
  const recipientText = params.sharedWithName?.trim() || "a teacher";

  const detail =
    params.audience === "owner"
      ? `Sharing access for course ${params.courseCode} has been granted to ${recipientText}.`
      : `You have been granted sharing access to course ${params.courseCode}, owned by ${ownerText}.`;

  return [
    `${params.appName} Sharing Notification`,
    "",
    greeting,
    "",
    detail,
    "",
    "Please sign in to CourseDrop for details.",
  ].join("\n");
}

export async function sendTeacherApprovalStatusEmail(
  input: TeacherApprovalStatusEmailInput
): Promise<void> {
  const config = getEmailRuntimeConfig();
  const payload = {
    from: config.fromEmail,
    to: [input.toEmail],
    subject: input.approved
      ? `${config.appName} account approved`
      : `${config.appName} account access revoked`,
    html: buildTeacherApprovalEmailHtml({
      appName: config.appName,
      appUrl: config.appUrl,
      recipientName: input.recipientName,
      approved: input.approved,
    }),
    text: buildTeacherApprovalEmailText({
      appName: config.appName,
      recipientName: input.recipientName,
      approved: input.approved,
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
    const raw = await res.text();
    throw new Error(`Failed to send account status email (${res.status}): ${raw}`);
  }
}

export async function sendSubjectRequestStatusEmail(
  input: SubjectRequestStatusEmailInput
): Promise<void> {
  const config = getEmailRuntimeConfig();
  const payload = {
    from: config.fromEmail,
    to: [input.toEmail],
    subject: `${config.appName} request ${input.approved ? "approved" : "rejected"} (${input.courseCode})`,
    html: buildSubjectRequestStatusHtml({
      appName: config.appName,
      appUrl: config.appUrl,
      recipientName: input.recipientName,
      subjectName: input.subjectName,
      courseCode: input.courseCode,
      approved: input.approved,
    }),
    text: buildSubjectRequestStatusText({
      appName: config.appName,
      recipientName: input.recipientName,
      subjectName: input.subjectName,
      courseCode: input.courseCode,
      approved: input.approved,
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
    const raw = await res.text();
    throw new Error(`Failed to send request status email (${res.status}): ${raw}`);
  }
}

export async function sendCourseSharingNotificationEmail(
  input: CourseSharingNotificationEmailInput
): Promise<void> {
  const config = getEmailRuntimeConfig();

  const payload = {
    from: config.fromEmail,
    to: [input.toEmail],
    subject:
      input.audience === "owner"
        ? `${config.appName} sharing granted (${input.courseCode})`
        : `${config.appName} folder access granted (${input.courseCode})`,
    html: buildCourseSharingNotificationHtml({
      appName: config.appName,
      appUrl: config.appUrl,
      recipientName: input.recipientName,
      courseCode: input.courseCode,
      ownerName: input.ownerName,
      sharedWithName: input.sharedWithName,
      audience: input.audience,
    }),
    text: buildCourseSharingNotificationText({
      appName: config.appName,
      recipientName: input.recipientName,
      courseCode: input.courseCode,
      ownerName: input.ownerName,
      sharedWithName: input.sharedWithName,
      audience: input.audience,
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
    const raw = await res.text();
    throw new Error(`Failed to send sharing notification email (${res.status}): ${raw}`);
  }
}
