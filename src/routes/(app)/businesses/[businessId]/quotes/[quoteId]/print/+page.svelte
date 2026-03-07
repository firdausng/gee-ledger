<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ArrowLeft, Printer } from '@lucide/svelte';
	import InvoicePreview from '$lib/components/InvoicePreview.svelte';
	import { api } from '$lib/client/api.svelte';

	let { data } = $props();

	const q           = $derived(data.quote);
	const biz         = $derived(data.business);
	const location    = $derived(data.location);
	const category    = $derived(data.category);
	const loadedItems = $derived(data.items);
	const businessId  = $page.params.businessId!;
	const quoteId     = $page.params.quoteId!;

	// Map quote to transaction shape for InvoicePreview
	const txForPreview = $derived({
		type: 'income' as const,
		amount: q.amount,
		transactionDate: q.quoteDate,
		note: q.note,
		referenceNo: q.referenceNo
	});

	let billToName  = $state(data.contact?.name ?? '');
	let billToAddr  = $state(data.contact?.address ?? '');
	let billToEmail = $state('');
	let quoteNo     = $state(q.quoteNo ?? '');

	const billTo = $derived(
		(billToName || billToAddr || billToEmail)
			? { name: billToName || undefined, address: billToAddr || undefined, email: billToEmail || undefined }
			: undefined
	);

	async function onQuoteNoBlur() {
		try {
			await api.patch(`/businesses/${businessId}/quotes/${quoteId}`, {
				quoteNo: quoteNo.trim() || null
			});
		} catch { /* silently ignore */ }
	}

	onMount(async () => {
		if (!q.quoteNo) {
			try {
				const r = await api.post<{ quoteNo: string }>(
					`/businesses/${businessId}/quotes/${quoteId}/assign-quote-no`, {}
				);
				quoteNo = r.quoteNo;
			} catch { /* silently ignore */ }
		}
	});
</script>

<svelte:head>
	<title>Quote — {biz.name}</title>
</svelte:head>

<style>
	@page { margin: 1.5cm; size: A4; }
	@media print {
		.no-print { display: none !important; }
		.print-paper { box-shadow: none !important; }
	}
</style>

<!-- Action bar -->
<div class="no-print sticky top-0 z-10 bg-card border-b border-border flex items-center gap-2 px-3 sm:px-4 h-14 shrink-0">
	<a
		href="/businesses/{businessId}/quotes/{quoteId}"
		class="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
		title="Back to quote"
	>
		<ArrowLeft class="size-4" />
	</a>

	<span class="text-sm font-medium text-foreground flex-1 truncate min-w-0">
		<span class="hidden sm:inline">{biz.name} / </span><span class="text-muted-foreground">Quote</span>
	</span>

	<button
		onclick={() => window.print()}
		class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
	>
		<Printer class="size-3.5" />
		<span class="hidden sm:inline">Print PDF</span>
		<span class="sm:hidden">Print</span>
	</button>
</div>

<!-- Desktop layout -->
<div class="no-print hidden md:flex h-[calc(100vh-3.5rem)] overflow-hidden">

	<!-- Left: controls -->
	<div class="w-64 shrink-0 border-r border-border flex flex-col overflow-y-auto bg-card">
		<div class="px-4 py-3 border-b border-border">
			<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Quote No</p>
			<input type="text" bind:value={quoteNo} onblur={onQuoteNoBlur} placeholder="QUOTE-0001"
				class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
		</div>

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
			<InvoicePreview transaction={txForPreview} business={biz} {location} {category} {businessId}
				billTo={billTo} items={loadedItems}
				invoiceNo={quoteNo || null}
				documentType="quote" />
		</div>
	</div>
</div>

<!-- Mobile layout -->
<div class="no-print md:hidden overflow-y-auto">
	<div class="bg-card border-b border-border">
		<div class="grid grid-cols-2 divide-x divide-border border-b border-border">
			<div class="px-4 py-3">
				<p class="text-xs text-muted-foreground mb-1">Quote No</p>
				<input type="text" bind:value={quoteNo} onblur={onQuoteNoBlur} placeholder="QUOTE-0001"
					class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
			</div>
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

	<div class="bg-gray-100 px-2 py-4">
		<div class="print-paper bg-white shadow-md rounded-sm mx-auto">
			<InvoicePreview transaction={txForPreview} business={biz} {location} {category} {businessId}
				billTo={billTo} items={loadedItems}
				invoiceNo={quoteNo || null}
				documentType="quote" compact={true} />
		</div>
	</div>
</div>

<!-- Print-only output -->
<div class="hidden print:block">
	<InvoicePreview transaction={txForPreview} business={biz} {location} {category} {businessId}
		billTo={billTo} items={loadedItems}
		invoiceNo={quoteNo || null}
		documentType="quote" />
</div>
