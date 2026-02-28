<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ArrowLeft, Printer, Mail, Crown } from '@lucide/svelte';
	import InvoicePreview from '$lib/components/InvoicePreview.svelte';
	import { api } from '$lib/client/api.svelte';
	import { PLAN_KEY } from '$lib/configurations/plans';

	let { data } = $props();

	const tx          = $derived(data.transaction);
	const biz         = $derived(data.business);
	const location    = $derived(data.location);
	const category    = $derived(data.category);
	const loadedItems = $derived(data.items);
	const businessId    = $page.params.businessId!;
	const transactionId = $page.params.transactionId!;
	const canEmail = $derived(
		($page.data.navBusinesses as { id: string; planKey: string }[])
			?.find((b) => b.id === businessId)?.planKey === PLAN_KEY.PRO
	);

	type DocType = 'invoice' | 'receipt';

	function defaultDocType(txType: string): DocType {
		return txType === 'expense' ? 'receipt' : 'invoice';
	}

	function displayTitle(dt: DocType) {
		return dt === 'invoice' ? 'Invoice' : 'Receipt';
	}

	let documentType = $state<DocType>((data.transaction.documentType as DocType | null) ?? defaultDocType(data.transaction.type));
	let billToName  = $state(data.contact?.name ?? '');
	let billToAddr  = $state(data.contact?.address ?? '');
	let billToEmail = $state('');
	let invoiceNo   = $state(tx.invoiceNo ?? '');
	let receiptNo   = $state(tx.receiptNo ?? '');

	const title = $derived(displayTitle(documentType));

	const billTo = $derived(
		(billToName || billToAddr || billToEmail)
			? { name: billToName || undefined, address: billToAddr || undefined, email: billToEmail || undefined }
			: undefined
	);

	async function setDocumentType(dt: DocType) {
		documentType = dt;
		try {
			await api.patch(`/businesses/${businessId}/transactions/${transactionId}`, { documentType: dt });
		} catch { /* silently ignore */ }
	}

	async function onInvoiceNoBlur() {
		try {
			await api.patch(`/businesses/${businessId}/transactions/${transactionId}`, {
				invoiceNo: invoiceNo.trim() || null
			});
		} catch { /* silently ignore */ }
	}

	async function onReceiptNoBlur() {
		try {
			await api.patch(`/businesses/${businessId}/transactions/${transactionId}`, {
				receiptNo: receiptNo.trim() || null
			});
		} catch { /* silently ignore */ }
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
	<title>{title} — {biz.name}</title>
</svelte:head>

<style>
	@page { margin: 1.5cm; size: A4; }
	@media print {
		.no-print { display: none !important; }
		.print-paper { box-shadow: none !important; }
	}
</style>

<!-- ── Action bar ─────────────────────────────────────────────────────────── -->
<div class="no-print sticky top-0 z-10 bg-card border-b border-border flex items-center gap-2 px-3 sm:px-4 h-14 shrink-0">
	<a
		href="/businesses/{businessId}/transactions/{transactionId}"
		class="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
		title="Back to transaction"
	>
		<ArrowLeft class="size-4" />
	</a>

	<span class="text-sm font-medium text-foreground flex-1 truncate min-w-0">
		<span class="hidden sm:inline">{biz.name} / </span><span class="text-muted-foreground">{title}</span>
	</span>

	{#if canEmail}
		<a
			href="/businesses/{businessId}/transactions/{transactionId}/email"
			class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors shrink-0"
			title="Email"
		>
			<Mail class="size-3.5" />
			<span class="hidden sm:inline">Email</span>
		</a>
	{:else}
		<span
			class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md border border-input bg-muted text-sm font-medium text-muted-foreground cursor-not-allowed shrink-0"
			title="Email — Pro plan"
		>
			<Crown class="size-3.5 text-amber-500" />
			<span class="hidden sm:inline">Email</span>
			<span class="text-[10px] font-semibold text-amber-600 bg-amber-100 px-1 rounded">Pro</span>
		</span>
	{/if}

	<button
		onclick={() => window.print()}
		class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
	>
		<Printer class="size-3.5" />
		<span class="hidden sm:inline">Print PDF</span>
		<span class="sm:hidden">Print</span>
	</button>
</div>

<!-- ── Desktop layout: side-by-side, fixed height ─────────────────────────── -->
<div class="no-print hidden md:flex h-[calc(100vh-3.5rem)] overflow-hidden">

	<!-- Left: controls -->
	<div class="w-64 shrink-0 border-r border-border flex flex-col overflow-y-auto bg-card">
			<div class="px-4 py-3 border-b border-border">
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

		{#if documentType === 'invoice'}
			<div class="px-4 py-3 border-b border-border">
				<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Invoice No</p>
				<input type="text" bind:value={invoiceNo} onblur={onInvoiceNoBlur} placeholder="INV-0001"
					class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
			</div>
		{:else if documentType === 'receipt'}
			<div class="px-4 py-3 border-b border-border">
				<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Receipt No</p>
				<input type="text" bind:value={receiptNo} onblur={onReceiptNoBlur} placeholder="REC-0001"
					class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
			</div>
		{/if}

		<div class="px-4 py-3 border-b border-border">
			<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bill To</p>
			<p class="text-xs text-muted-foreground mt-0.5">Appears on the document</p>
		</div>
		<div class="divide-y divide-border">
			<div class="px-4 py-3">
				<label for="print-billto-name" class="block text-xs text-muted-foreground mb-1">Name</label>
				<input id="print-billto-name" type="text" bind:value={billToName} placeholder="Recipient or company name"
					class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
			</div>
			<div class="px-4 py-3">
				<label for="print-billto-addr" class="block text-xs text-muted-foreground mb-1">Address</label>
				<textarea id="print-billto-addr" bind:value={billToAddr} placeholder="Street, city, postcode…" rows="3"
					class="w-full text-sm text-foreground bg-transparent focus:outline-none resize-none"></textarea>
			</div>
			<div class="px-4 py-3">
				<label for="print-billto-email" class="block text-xs text-muted-foreground mb-1">Email</label>
				<input id="print-billto-email" type="email" bind:value={billToEmail} placeholder="recipient@example.com"
					class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
			</div>
		</div>
	</div>

	<!-- Right: document viewer -->
	<div class="flex-1 bg-gray-200 overflow-y-auto py-8 px-4 flex justify-center">
		<div class="print-paper w-full max-w-2xl bg-white shadow-2xl rounded-sm">
			<InvoicePreview transaction={tx} business={biz} {location} {category} {businessId}
				billTo={billTo} items={loadedItems}
				invoiceNo={documentType === 'invoice' ? (invoiceNo || null) : null}
				receiptNo={documentType === 'receipt' ? (receiptNo || null) : null}
				featuredImageId={tx.featuredImageId} {documentType} />
		</div>
	</div>
</div>

<!-- ── Mobile layout: stacked, scrollable ─────────────────────────────────── -->
<div class="no-print md:hidden overflow-y-auto">

	<!-- Controls card -->
	<div class="bg-card border-b border-border">
			<div class="px-4 py-3 border-b border-border">
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

		<div class="grid grid-cols-2 divide-x divide-border border-b border-border">
			{#if documentType === 'invoice'}
				<div class="px-4 py-3">
					<p class="text-xs text-muted-foreground mb-1">Invoice No</p>
					<input type="text" bind:value={invoiceNo} onblur={onInvoiceNoBlur} placeholder="INV-0001"
						class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
				</div>
			{:else if documentType === 'receipt'}
				<div class="px-4 py-3">
					<p class="text-xs text-muted-foreground mb-1">Receipt No</p>
					<input type="text" bind:value={receiptNo} onblur={onReceiptNoBlur} placeholder="REC-0001"
						class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
				</div>
			{/if}
			<div class="px-4 py-3">
				<p class="text-xs text-muted-foreground mb-1">Bill To (name)</p>
				<input type="text" bind:value={billToName} placeholder="Recipient name"
					class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
			</div>
		</div>

		<div class="grid grid-cols-2 divide-x divide-border">
			<div class="px-4 py-3">
				<p class="text-xs text-muted-foreground mb-1">Address</p>
				<textarea bind:value={billToAddr} placeholder="Street, city…" rows="2"
					class="w-full text-sm text-foreground bg-transparent focus:outline-none resize-none"></textarea>
			</div>
			<div class="px-4 py-3">
				<p class="text-xs text-muted-foreground mb-1">Email</p>
				<input type="email" bind:value={billToEmail} placeholder="recipient@example.com"
					class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
			</div>
		</div>
	</div>

	<!-- Document preview -->
	<div class="bg-gray-100 px-3 py-5">
		<div class="print-paper bg-white shadow-md rounded-sm mx-auto max-w-lg">
			<InvoicePreview transaction={tx} business={biz} {location} {category} {businessId}
				billTo={billTo} items={loadedItems}
				invoiceNo={documentType === 'invoice' ? (invoiceNo || null) : null}
				receiptNo={documentType === 'receipt' ? (receiptNo || null) : null}
				featuredImageId={tx.featuredImageId} {documentType} compact={true} />
		</div>
	</div>
</div>

<!-- ── Print-only output ──────────────────────────────────────────────────── -->
<div class="hidden print:block">
	<InvoicePreview transaction={tx} business={biz} {location} {category} {businessId}
		billTo={billTo} items={loadedItems}
		invoiceNo={documentType === 'invoice' ? (invoiceNo || null) : null}
		receiptNo={documentType === 'receipt' ? (receiptNo || null) : null}
		featuredImageId={tx.featuredImageId} {documentType} />
</div>
