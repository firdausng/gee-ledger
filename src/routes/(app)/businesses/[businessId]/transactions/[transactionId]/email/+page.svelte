<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/client/api.svelte';
	import { ArrowLeft, Send, Loader2, CheckCircle2 } from '@lucide/svelte';
	import InvoicePreview from '$lib/components/InvoicePreview.svelte';

	let { data } = $props();

	const { transaction: tx, business: biz, location, category, items: loadedItems } = data;
	const businessId    = $page.params.businessId;
	const transactionId = $page.params.transactionId;

	type DocType = 'invoice' | 'receipt';

	function defaultDocType(txType: string): DocType {
		return txType === 'expense' ? 'receipt' : 'invoice';
	}

	function formatAmount(cents: number, currency: string): string {
		return new Intl.NumberFormat('en-MY', { style: 'currency', currency }).format(cents / 100);
	}

	const amount = formatAmount(tx.amount, biz.currency);

	let documentType = $state<DocType>((tx.documentType as DocType | null) ?? defaultDocType(tx.type));
	let toEmail      = $state(data.contact?.email ?? '');
	let billToName   = $state(data.contact?.name ?? '');
	let billToAddr   = $state(data.contact?.address ?? '');
	let subject      = $state('');
	let sending      = $state(false);
	let sent         = $state(false);
	let sendError    = $state<string | null>(null);
	let invoiceNo    = $state(tx.invoiceNo ?? '');
	let receiptNo    = $state(tx.receiptNo ?? '');

	const titleLabel = $derived(documentType === 'invoice' ? 'Invoice' : 'Receipt');

	$effect(() => {
		subject = `${titleLabel} from ${biz.name}`;
	});

	const billTo = $derived(
		(billToName || billToAddr || toEmail)
			? { name: billToName || undefined, address: billToAddr || undefined, email: toEmail || undefined }
			: undefined
	);

	async function setDocumentType(dt: DocType) {
		documentType = dt;
		try {
			await api.patch(`/businesses/${businessId}/transactions/${transactionId}`, { documentType: dt });
		} catch { /* silently ignore */ }
	}

	async function send() {
		try {
			sending = true;
			sendError = null;
			await api.post(`/businesses/${businessId}/transactions/${transactionId}/share`, {
				email: toEmail,
				...(billTo ? { billTo } : {}),
				invoiceNo:    documentType === 'invoice' ? (invoiceNo || null) : null,
				receiptNo:    documentType === 'receipt' ? (receiptNo || null) : null,
				documentType,
			});
			sent = true;
		} catch (e) {
			sendError = e instanceof Error ? e.message : 'Failed to send email';
		} finally {
			sending = false;
		}
	}

	onMount(async () => {
		if (documentType === 'invoice' && !tx.invoiceNo) {
			try {
				const r = await api.post<{ invoiceNo: string }>(
					`/businesses/${businessId}/transactions/${transactionId}/assign-invoice-no`, {}
				);
				invoiceNo = r.invoiceNo;
			} catch { /* silently ignore */ }
		} else if (documentType === 'receipt' && !tx.receiptNo) {
			try {
				const r = await api.post<{ receiptNo: string }>(
					`/businesses/${businessId}/transactions/${transactionId}/assign-receipt-no`, {}
				);
				receiptNo = r.receiptNo;
			} catch { /* silently ignore */ }
		}
	});
</script>

<svelte:head>
	<title>Email {titleLabel} — {biz.name}</title>
</svelte:head>

<!-- ── Action bar ─────────────────────────────────────────────────────────── -->
<div class="sticky top-0 z-10 bg-card border-b border-border flex items-center gap-2 px-3 sm:px-4 h-14 shrink-0">
	<a
		href="/businesses/{businessId}/transactions/{transactionId}/print"
		class="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
		title="Back to PDF view"
	>
		<ArrowLeft class="size-4" />
	</a>

	<span class="text-sm font-medium text-foreground flex-1 truncate min-w-0">
		<span class="hidden sm:inline">{biz.name} / </span><span class="text-muted-foreground">Email {titleLabel}</span>
	</span>

	{#if sent}
		<span class="flex items-center gap-1.5 text-sm text-green-600 font-medium shrink-0">
			<CheckCircle2 class="size-4" />
			<span class="hidden sm:inline">Email sent!</span>
			<span class="sm:hidden">Sent!</span>
		</span>
	{:else}
		<button
			onclick={send}
			disabled={sending || !toEmail}
			class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
		>
			{#if sending}
				<Loader2 class="size-3.5 animate-spin" />
				<span class="hidden sm:inline">Sending…</span>
			{:else}
				<Send class="size-3.5" />
				<span class="hidden sm:inline">Send Email</span>
				<span class="sm:hidden">Send</span>
			{/if}
		</button>
	{/if}
</div>

<!-- ── Desktop: side-by-side fixed-height ────────────────────────────────── -->
<div class="hidden lg:flex h-[calc(100vh-3.5rem)] overflow-hidden">

	<!-- Left: compose form -->
	<div class="w-[420px] shrink-0 border-r border-border flex flex-col overflow-y-auto">
		<div class="border-b border-border">
					<div class="px-5 py-3 border-b border-border">
					<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Document Type</p>
					<div class="flex rounded-md border border-input overflow-hidden text-sm">
						<button type="button" onclick={() => setDocumentType('invoice')}
							class="flex-1 py-1.5 font-medium transition-colors {documentType === 'invoice' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}">
							Invoice
						</button>
						<button type="button" onclick={() => setDocumentType('receipt')}
							class="flex-1 py-1.5 font-medium transition-colors border-l border-input {documentType === 'receipt' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}">
							Receipt
						</button>
					</div>
				</div>
				<div class="flex items-center gap-3 px-5 py-3 border-b border-border">
				<span class="text-sm text-muted-foreground w-20 shrink-0">To</span>
				<input type="email" bind:value={toEmail} placeholder="recipient@example.com"
					class="flex-1 text-sm text-foreground bg-transparent focus:outline-none" />
			</div>
			<div class="flex items-center gap-3 px-5 py-3 border-b border-border">
				<span class="text-sm text-muted-foreground w-20 shrink-0">Subject</span>
				<input type="text" bind:value={subject}
					class="flex-1 text-sm text-foreground bg-transparent focus:outline-none" />
			</div>
			<div class="flex items-start gap-3 px-5 py-3 border-b border-border">
				<span class="text-sm text-muted-foreground w-20 shrink-0 mt-0.5">Bill To</span>
				<div class="flex-1 flex flex-col gap-2">
					<input type="text" bind:value={billToName} placeholder="Recipient name (optional)"
						class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
					<textarea bind:value={billToAddr} placeholder="Address (optional)" rows="2"
						class="w-full text-sm text-foreground bg-transparent focus:outline-none resize-none"></textarea>
				</div>
			</div>
			{#if documentType === 'invoice'}
				<div class="flex items-center gap-3 px-5 py-3 border-b border-border">
					<span class="text-sm text-muted-foreground w-20 shrink-0">Invoice No</span>
					<input type="text" bind:value={invoiceNo} placeholder="INV-0001"
						class="flex-1 text-sm text-foreground bg-transparent focus:outline-none" />
				</div>
			{:else if documentType === 'receipt'}
				<div class="flex items-center gap-3 px-5 py-3 border-b border-border">
					<span class="text-sm text-muted-foreground w-20 shrink-0">Receipt No</span>
					<input type="text" bind:value={receiptNo} placeholder="REC-0001"
						class="flex-1 text-sm text-foreground bg-transparent focus:outline-none" />
				</div>
			{/if}
		</div>

		{#if sendError}
			<div class="px-5 py-3 bg-destructive/10 border-b border-destructive/20">
				<p class="text-sm text-destructive">{sendError}</p>
			</div>
		{/if}

		<div class="flex-1 p-5 bg-muted/20">
			<p class="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-4">Email Preview</p>
			<div class="bg-white rounded-lg border border-border shadow-sm overflow-hidden text-sm">
				<div class="px-5 py-3 border-b border-gray-100">
					<p class="font-semibold text-gray-900">{subject}</p>
				</div>
				<div class="px-5 py-5 text-center">
					<p class="font-bold text-gray-900 text-base mb-1">{biz.name}</p>
					<p class="text-gray-500 text-sm mb-5">You have received a {titleLabel.toLowerCase()} for <strong>{amount}</strong>.</p>
					<div class="inline-block bg-primary text-primary-foreground text-sm font-medium px-6 py-2.5 rounded-md mb-5">View {titleLabel}</div>
					<div class="border-t border-gray-100 pt-4 text-xs text-gray-400"><p>Sent via Gee Ledger</p></div>
				</div>
			</div>
			<p class="text-xs text-muted-foreground mt-4 text-center">The full {titleLabel.toLowerCase()} details will be included in the email body.</p>
		</div>
	</div>

	<!-- Right: document preview -->
	<div class="flex-1 bg-gray-200 overflow-y-auto justify-center py-8 px-6 flex">
		<div class="w-full max-w-xl bg-white shadow-xl rounded-sm">
			<InvoicePreview transaction={tx} business={biz} {location} {category} {businessId}
				billTo={billTo} items={loadedItems}
				invoiceNo={documentType === 'invoice' ? (invoiceNo || null) : null}
				receiptNo={documentType === 'receipt' ? (receiptNo || null) : null}
				featuredImageId={tx.featuredImageId} {documentType} compact={true} />
		</div>
	</div>
</div>

<!-- ── Mobile: single-column, normal scroll ───────────────────────────────── -->
<div class="lg:hidden flex flex-col">

	<!-- Document type toggle -->
		<div class="px-4 py-3 border-b border-border bg-card">
			<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Document Type</p>
			<div class="flex rounded-md border border-input overflow-hidden text-sm">
				<button type="button" onclick={() => setDocumentType('invoice')}
					class="flex-1 py-2 font-medium transition-colors {documentType === 'invoice' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}">
					Invoice
				</button>
				<button type="button" onclick={() => setDocumentType('receipt')}
					class="flex-1 py-2 font-medium transition-colors border-l border-input {documentType === 'receipt' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}">
					Receipt
				</button>
			</div>
		</div>

	<!-- Compose fields -->
	<div class="bg-card border-b border-border">
		<div class="flex items-center gap-3 px-4 py-3 border-b border-border">
			<span class="text-sm text-muted-foreground w-20 shrink-0">To</span>
			<input type="email" bind:value={toEmail} placeholder="recipient@example.com"
				class="flex-1 text-sm text-foreground bg-transparent focus:outline-none" />
		</div>
		<div class="flex items-center gap-3 px-4 py-3 border-b border-border">
			<span class="text-sm text-muted-foreground w-20 shrink-0">Subject</span>
			<input type="text" bind:value={subject}
				class="flex-1 text-sm text-foreground bg-transparent focus:outline-none" />
		</div>
		<div class="flex items-start gap-3 px-4 py-3 border-b border-border">
			<span class="text-sm text-muted-foreground w-20 shrink-0 mt-0.5">Bill To</span>
			<div class="flex-1 flex flex-col gap-2">
				<input type="text" bind:value={billToName} placeholder="Recipient name (optional)"
					class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
				<textarea bind:value={billToAddr} placeholder="Address (optional)" rows="2"
					class="w-full text-sm text-foreground bg-transparent focus:outline-none resize-none"></textarea>
			</div>
		</div>
		{#if documentType === 'invoice'}
			<div class="flex items-center gap-3 px-4 py-3">
				<span class="text-sm text-muted-foreground w-20 shrink-0">Invoice No</span>
				<input type="text" bind:value={invoiceNo} placeholder="INV-0001"
					class="flex-1 text-sm text-foreground bg-transparent focus:outline-none" />
			</div>
		{:else if documentType === 'receipt'}
			<div class="flex items-center gap-3 px-4 py-3">
				<span class="text-sm text-muted-foreground w-20 shrink-0">Receipt No</span>
				<input type="text" bind:value={receiptNo} placeholder="REC-0001"
					class="flex-1 text-sm text-foreground bg-transparent focus:outline-none" />
			</div>
		{/if}
	</div>

	{#if sendError}
		<div class="px-4 py-3 bg-destructive/10 border-b border-destructive/20">
			<p class="text-sm text-destructive">{sendError}</p>
		</div>
	{/if}

	<!-- Send button (mobile) -->
	{#if !sent}
		<div class="px-4 py-4 border-b border-border">
			<button
				onclick={send}
				disabled={sending || !toEmail}
				class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
			>
				{#if sending}
					<Loader2 class="size-4 animate-spin" />
					Sending…
				{:else}
					<Send class="size-4" />
					Send Email
				{/if}
			</button>
		</div>
	{:else}
		<div class="px-4 py-4 border-b border-border flex items-center justify-center gap-2 text-green-600">
			<CheckCircle2 class="size-4" />
			<span class="text-sm font-medium">Email sent!</span>
		</div>
	{/if}

	<!-- Email body card preview -->
	<div class="p-4 bg-muted/20">
		<p class="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Email Preview</p>
		<div class="bg-white rounded-lg border border-border shadow-sm overflow-hidden text-sm">
			<div class="px-4 py-3 border-b border-gray-100">
				<p class="font-semibold text-gray-900 truncate">{subject}</p>
			</div>
			<div class="px-4 py-5 text-center">
				<p class="font-bold text-gray-900 text-base mb-1">{biz.name}</p>
				<p class="text-gray-500 text-sm mb-4">You have received a {titleLabel.toLowerCase()} for <strong>{amount}</strong>.</p>
				<div class="inline-block bg-primary text-primary-foreground text-sm font-medium px-5 py-2 rounded-md mb-4">View {titleLabel}</div>
				<div class="border-t border-gray-100 pt-3 text-xs text-gray-400"><p>Sent via Gee Ledger</p></div>
			</div>
		</div>
		<p class="text-xs text-muted-foreground mt-3 text-center">Full {titleLabel.toLowerCase()} details will be included in the email.</p>
	</div>
</div>
