function buildHtml(opts: {
	businessName: string;
	inviterName: string;
	roleName: string;
	signInUrl: string;
	appDomain: string;
	type: 'invited' | 'added';
}): string {
	const { businessName, inviterName, roleName, signInUrl, appDomain, type } = opts;

	const heading = type === 'added'
		? `You've been added to ${businessName}`
		: `You've been invited to join ${businessName}`;

	const body = type === 'added'
		? `<b>${inviterName}</b> has added you to <b>${businessName}</b> as a <b>${roleName}</b>. Sign in to get started.`
		: `<b>${inviterName}</b> has invited you to collaborate on <b>${businessName}</b> as a <b>${roleName}</b>. Sign in to accept.`;

	const ctaLabel = type === 'added' ? 'Sign In' : 'Sign In to Accept';

	const expiry = type === 'invited'
		? '<p style="margin:16px 0 0;font-size:12px;color:#9ca3af">This invitation expires in 7 days.</p>'
		: '';

	return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;max-width:100%">

        <!-- Header -->
        <tr><td style="padding:24px 32px;border-bottom:1px solid #e5e7eb">
          <p style="margin:0;font-size:18px;font-weight:700;color:#111827">Gee Ledger</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 32px 24px">
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827">${heading}</h1>
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6">${body}</p>
          ${expiry}
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 32px 32px">
          <a href="${signInUrl}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px">${ctaLabel}</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center">
          <p style="margin:0;font-size:12px;color:#9ca3af">Sent via <a href="https://${appDomain}" style="color:#6b7280">${appDomain}</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendInvitationEmail(opts: {
	to: string;
	businessName: string;
	inviterName: string;
	roleName: string;
	signInUrl: string;
	resendApiKey: string;
	fromDomain: string;
	appDomain: string;
	type: 'invited' | 'added';
}): Promise<void> {
	const { to, businessName, resendApiKey, fromDomain, appDomain, type } = opts;

	const subject = type === 'added'
		? `You've been added to ${businessName}`
		: `You've been invited to join ${businessName}`;

	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${resendApiKey}`,
			'Content-Type':  'application/json',
		},
		body: JSON.stringify({
			from:    `Gee Ledger <noreply@${fromDomain}>`,
			to:      [to],
			subject,
			html:    buildHtml(opts),
		}),
	});

	if (!res.ok) {
		const body = await res.text();
		console.error(`Failed to send invitation email: ${res.status} ${body}`);
	}
}
