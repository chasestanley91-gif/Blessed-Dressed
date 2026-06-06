import { Resend } from "resend";
import type { ConsultationRequest } from "@/app/api/consultation/route";

const TIME_LABELS: Record<string, string> = {
  "weekday-morning":   "Weekday Mornings (Mon–Fri, 9am–12pm)",
  "weekday-afternoon": "Weekday Afternoons (Mon–Fri, 12pm–5pm)",
  "weekday-evening":   "Weekday Evenings (Mon–Fri, 5pm–7pm)",
  "saturday-morning":  "Saturday Morning (9am–12pm)",
  "saturday-afternoon":"Saturday Afternoon (12pm–4pm)",
};

export async function sendConsultationNotification(
  consultation: ConsultationRequest
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping consultation notification");
    return;
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";
  const to = process.env.ADMIN_EMAIL ?? "chasestanley91@gmail.com";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const availability = consultation.timesAvailable
    .map((id) => TIME_LABELS[id] ?? id)
    .join(", ") || "—";

  const submittedAt = new Date(consultation.createdAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f1e6; margin: 0; padding: 32px 16px; }
    .card { background: #071a2d; border-radius: 12px; max-width: 560px; margin: 0 auto; overflow: hidden; }
    .header { background: #0b1b2e; padding: 28px 32px; border-bottom: 1px solid #1d3c62; }
    .header p { margin: 0; }
    .eyebrow { font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #d4af37; }
    .title { font-size: 22px; font-weight: 600; color: #f5f1e6; margin-top: 6px !important; }
    .meta { font-size: 12px; color: #9b9180; margin-top: 4px !important; }
    .body { padding: 28px 32px; }
    .section { margin-bottom: 24px; }
    .section-label { font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: #d4af37; margin-bottom: 10px; }
    .row { display: flex; gap: 8px; margin-bottom: 8px; }
    .key { font-size: 12px; color: #9b9180; width: 100px; flex-shrink: 0; }
    .val { font-size: 12px; color: #f5f1e6; }
    .notes { background: #040e1a; border-radius: 8px; padding: 14px 16px; font-size: 12px; color: #c9c1b3; line-height: 1.7; white-space: pre-wrap; }
    .cta { text-align: center; padding: 24px 32px 32px; }
    .btn { display: inline-block; background: #d4af37; color: #071a2d; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 999px; text-decoration: none; }
    .divider { border: none; border-top: 1px solid #1d3c62; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <p class="eyebrow">Blessed &amp; Dressed — New Lead</p>
      <p class="title">Consultation Request</p>
      <p class="meta">${consultation.id} &nbsp;·&nbsp; Submitted ${submittedAt}</p>
    </div>
    <div class="body">
      <div class="section">
        <div class="section-label">Contact</div>
        <div class="row"><span class="key">Name</span><span class="val">${consultation.firstName} ${consultation.lastName}</span></div>
        <div class="row"><span class="key">Email</span><span class="val">${consultation.email}</span></div>
        <div class="row"><span class="key">Phone</span><span class="val">${consultation.phone}</span></div>
      </div>
      <hr class="divider" />
      <div class="section" style="margin-top:20px">
        <div class="section-label">Availability</div>
        <div class="row"><span class="val">${availability}</span></div>
      </div>
      <hr class="divider" />
      <div class="section" style="margin-top:20px">
        <div class="section-label">Preferences</div>
        <div class="row"><span class="key">Product</span><span class="val">${consultation.product || "—"}</span></div>
        <div class="row"><span class="key">Colors</span><span class="val">${consultation.colors || "—"}</span></div>
        <div class="row"><span class="key">Pattern</span><span class="val">${consultation.patterns || "—"}</span></div>
        <div class="row"><span class="key">Budget</span><span class="val">${consultation.budget || "—"}</span></div>
      </div>
      ${consultation.notes ? `
      <hr class="divider" />
      <div class="section" style="margin-top:20px">
        <div class="section-label">Notes from customer</div>
        <div class="notes">${consultation.notes}</div>
      </div>` : ""}
    </div>
    <div class="cta">
      <a href="${siteUrl}/admin/consultations" class="btn">View in Admin →</a>
    </div>
  </div>
</body>
</html>`;

  const text = [
    `NEW CONSULTATION REQUEST — ${consultation.id}`,
    `Submitted: ${submittedAt}`,
    "",
    "CONTACT",
    `Name:  ${consultation.firstName} ${consultation.lastName}`,
    `Email: ${consultation.email}`,
    `Phone: ${consultation.phone}`,
    "",
    "AVAILABILITY",
    availability,
    "",
    "PREFERENCES",
    `Product: ${consultation.product || "—"}`,
    `Colors:  ${consultation.colors || "—"}`,
    `Pattern: ${consultation.patterns || "—"}`,
    `Budget:  ${consultation.budget || "—"}`,
    consultation.notes ? `\nNOTES\n${consultation.notes}` : "",
    "",
    `View in admin: ${siteUrl}/admin/consultations`,
  ].join("\n");

  try {
    await resend.emails.send({
      from,
      to: [to],
      replyTo: consultation.email,
      subject: `New Consultation — ${consultation.firstName} ${consultation.lastName} (${consultation.id})`,
      html,
      text,
    });
  } catch (err) {
    console.error("[email] Failed to send consultation notification:", err);
  }
}
