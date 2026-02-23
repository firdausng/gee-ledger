type Business = {
	name: string;
	currency: string;
	address?: string | null;
	phone?: string | null;
	taxId?: string | null;
};

type BillTo = {
	name?: string | null;
	address?: string | null;
	email?: string | null;
};

type Transaction = {
	type: string;
	amount: number;
	transactionDate: string;
	note?: string | null;
	referenceNo?: string | null;
	invoiceNo?:    string | null;
	receiptNo?:    string | null;
	documentType?: 'invoice' | 'receipt' | null;
};

type LineItem = {
	description: string;
	quantity: number;
	unitPrice: number;
};

type NamedEntity = { name: string } | null;

function docTitle(type: string, documentType?: 'invoice' | 'receipt' | null): string {
	if (documentType === 'invoice') return 'INVOICE';
	if (documentType === 'receipt') return 'RECEIPT';
	if (type === 'income')   return 'INVOICE';
	if (type === 'expense')  return 'RECEIPT';
	return 'TRANSFER RECORD';
}

function formatAmount(cents: number, currency: string): string {
	return new Intl.NumberFormat('en-MY', { style: 'currency', currency }).format(cents / 100);
}

function buildHtml(opts: {
	business: Business;
	transaction: Transaction;
	location: NamedEntity;
	category: NamedEntity;
	channel: NamedEntity;
	billTo: BillTo | null;
	fromDomain: string;
	items?: LineItem[];
}): string {
	const { business, transaction, location, category, channel, billTo, fromDomain, items = [] } = opts;
	const title = docTitle(transaction.type, transaction.documentType);
	const amount = formatAmount(transaction.amount, business.currency);
	const hasItems = items.length > 0;

	const row = (label: string, value: string) => value
		? `<tr><td style="padding:4px 8px 4px 0;color:#6b7280;white-space:nowrap">${label}</td><td style="padding:4px 0">${value}</td></tr>`
		: '';

	const detailRows = [
		transaction.documentType === 'receipt' && transaction.receiptNo ? row('Receipt No', transaction.receiptNo) : '',
		transaction.documentType !== 'receipt' && transaction.invoiceNo ? row('Invoice No', transaction.invoiceNo) : '',
		row('Date',       transaction.transactionDate),
		row('Reference',  transaction.referenceNo ?? ''),
		row('Location',   location?.name ?? ''),
		row('Category',   category?.name ?? ''),
		row('Channel',    channel?.name ?? ''),
		row('Note',       transaction.note ?? ''),
	].filter(Boolean).join('\n');

	const businessMeta = [
		business.address,
		business.phone   ? `Phone: ${business.phone}` : null,
		business.taxId   ? `Tax ID: ${business.taxId}` : null,
	].filter(Boolean).join('<br>');

	const itemsTotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

	const itemsHtml = hasItems ? `
        <!-- Items table -->
        <tr><td style="padding:0 32px 24px">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border-collapse:collapse">
            <thead>
              <tr style="background:#f3f4f6;border-bottom:1px solid #e5e7eb">
                <th style="text-align:left;padding:8px 12px;color:#6b7280;font-weight:600">Description</th>
                <th style="text-align:right;padding:8px 12px;color:#6b7280;font-weight:600;width:48px">Qty</th>
                <th style="text-align:right;padding:8px 12px;color:#6b7280;font-weight:600;width:100px">Unit Price</th>
                <th style="text-align:right;padding:8px 12px;color:#6b7280;font-weight:600;width:100px">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
              <tr style="border-bottom:1px solid #f3f4f6">
                <td style="padding:8px 12px;color:#111827">${item.description}</td>
                <td style="padding:8px 12px;text-align:right;color:#6b7280">${item.quantity}</td>
                <td style="padding:8px 12px;text-align:right;color:#6b7280">${formatAmount(item.unitPrice, business.currency)}</td>
                <td style="padding:8px 12px;text-align:right;color:#111827">${formatAmount(item.quantity * item.unitPrice, business.currency)}</td>
              </tr>`).join('')}
            </tbody>
            <tfoot>
              <tr style="background:#f3f4f6;border-top:1px solid #e5e7eb">
                <td colspan="3" style="padding:10px 12px;text-align:right;font-weight:600;color:#6b7280">Total</td>
                <td style="padding:10px 12px;text-align:right;font-weight:700;font-size:16px;color:#111827">${formatAmount(itemsTotal, business.currency)}</td>
              </tr>
            </tfoot>
          </table>
        </td></tr>` : `
        <!-- Amount -->
        <tr><td style="padding:16px 32px;background:#f3f4f6;border-top:1px solid #e5e7eb;text-align:right">
          <p style="margin:0;font-size:13px;color:#6b7280">Total Amount</p>
          <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#111827">${amount}</p>
        </td></tr>`;

	return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;max-width:100%">

        <!-- Header -->
        <tr><td style="padding:24px 32px;border-bottom:1px solid #e5e7eb">
          <p style="margin:0;font-size:20px;font-weight:700;color:#111827">${business.name}</p>
          ${businessMeta ? `<p style="margin:6px 0 0;font-size:13px;color:#6b7280;line-height:1.6">${businessMeta}</p>` : ''}
        </td></tr>

        <!-- Document title -->
        <tr><td style="padding:24px 32px 16px">
          <p style="margin:0;font-size:22px;font-weight:700;color:#111827;letter-spacing:0.05em">${title}</p>
        </td></tr>

        ${billTo && (billTo.name || billTo.address || billTo.email) ? `
        <!-- Bill To -->
        <tr><td style="padding:0 32px 16px">
          <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em">Bill To</p>
          ${billTo.name    ? `<p style="margin:0;font-size:14px;font-weight:600;color:#111827">${billTo.name}</p>` : ''}
          ${billTo.address ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;white-space:pre-line">${billTo.address}</p>` : ''}
          ${billTo.email   ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280">${billTo.email}</p>` : ''}
        </td></tr>` : ''}

        <!-- Details table -->
        <tr><td style="padding:0 32px 24px">
          <table cellpadding="0" cellspacing="0" style="font-size:14px;color:#111827">
            ${detailRows}
          </table>
        </td></tr>

        ${itemsHtml}

        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center">
          <p style="margin:0;font-size:12px;color:#9ca3af">Sent via <a href="https://${fromDomain}" style="color:#6b7280">${fromDomain}</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendTransactionEmail(opts: {
	to: string;
	business: Business;
	transaction: Transaction;
	location: NamedEntity;
	category: NamedEntity;
	channel: NamedEntity;
	billTo: BillTo | null;
	resendApiKey: string;
	fromDomain: string;
	items?: LineItem[];
}): Promise<void> {
	const { to, business, transaction, resendApiKey, fromDomain } = opts;
	const title = docTitle(transaction.type, transaction.documentType);

	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${resendApiKey}`,
			'Content-Type':  'application/json',
		},
		body: JSON.stringify({
			from:    `${business.name} <receipts@${fromDomain}>`,
			to:      [to],
			subject: `${title.charAt(0) + title.slice(1).toLowerCase()} from ${business.name}`,
			html:    buildHtml(opts),
		}),
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Failed to send email: ${res.status} ${body}`);
	}
}
