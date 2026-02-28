<script lang="ts">
	type BillTo = {
		name?:    string;
		address?: string;
		email?:   string;
	};

	type LineItem = {
		description: string;
		quantity:    number;
		unitPrice:   number;
	};

	type Props = {
		transaction: {
			type: string;
			amount: number;
			transactionDate: string;
			note?: string | null;
			referenceNo?: string | null;
		};
		business: {
			name: string;
			currency: string;
			address?: string | null;
			phone?: string | null;
			taxId?: string | null;
			logoR2Key?: string | null;
		};
		location: { name: string } | null;
		category: { name: string } | null;
		businessId: string;
		billTo?:          BillTo;
		compact?:         boolean;
		items?:           LineItem[];
		invoiceNo?:       string | null;
		receiptNo?:       string | null;
		featuredImageId?: string | null;
		documentType?:    'invoice' | 'receipt' | null;
	};

	let {
		transaction: tx,
		business: biz,
		location,
		category,
		businessId,
		billTo,
		compact = false,
		items = [],
		invoiceNo,
		receiptNo,
		featuredImageId,
		documentType,
	}: Props = $props();

	function docTitle(type: string, override?: 'invoice' | 'receipt' | null): string {
		if (override === 'invoice') return 'INVOICE';
		if (override === 'receipt') return 'RECEIPT';
		if (type === 'expense') return 'RECEIPT';
		return 'INVOICE';
	}

	function formatAmount(cents: number, currency: string): string {
		return new Intl.NumberFormat('en-MY', { style: 'currency', currency }).format(cents / 100);
	}

	const title  = docTitle(tx.type, documentType);
	const amount = formatAmount(tx.amount, biz.currency);

	const hasItems = $derived(items.length > 0);

	const hasBillTo = $derived(
		!!(billTo?.name || billTo?.address || billTo?.email)
	);

	const itemsTotal = $derived(
		items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
	);
</script>

<div class="bg-white text-gray-900 font-sans {compact ? 'p-6' : 'p-10'}">

	<!-- Business header -->
	<div class="flex items-start gap-4 pb-5 border-b border-gray-200 mb-6">
		{#if biz.logoR2Key}
			<img
				src="/api/businesses/{businessId}/logo"
				alt="{biz.name} logo"
				class="{compact ? 'h-10 w-10' : 'h-14 w-14'} object-contain rounded shrink-0"
			/>
		{/if}
		<div class="flex-1 min-w-0">
			<p class="{compact ? 'text-base' : 'text-lg'} font-bold text-gray-900">{biz.name}</p>
			{#if biz.address}
				<p class="{compact ? 'text-xs' : 'text-sm'} text-gray-500 mt-0.5 whitespace-pre-line">{biz.address}</p>
			{/if}
			<div class="flex flex-wrap gap-x-3 mt-0.5 {compact ? 'text-xs' : 'text-sm'} text-gray-500">
				{#if biz.phone}<span>{biz.phone}</span>{/if}
				{#if biz.taxId}<span>Tax ID: {biz.taxId}</span>{/if}
			</div>
		</div>
	</div>

	<!-- Document title -->
	<p class="{compact ? 'text-xl' : 'text-3xl'} font-bold tracking-wide text-gray-900 mb-5">{title}</p>

	<!-- Two-column: invoice meta (left) + Bill To (right) -->
	<div class="grid grid-cols-2 gap-6 mb-6 {compact ? 'text-xs' : 'text-sm'}">
		<!-- Invoice meta -->
		<div class="flex flex-col gap-1 text-gray-600">
			{#if documentType === 'receipt' && receiptNo}
				<div class="flex gap-2">
					<span class="text-gray-400 w-24 shrink-0">Receipt No</span>
					<span class="font-semibold">{receiptNo}</span>
				</div>
			{:else if documentType !== 'receipt' && invoiceNo}
				<div class="flex gap-2">
					<span class="text-gray-400 w-24 shrink-0">Invoice No</span>
					<span class="font-semibold">{invoiceNo}</span>
				</div>
			{/if}
			<div class="flex gap-2">
				<span class="text-gray-400 w-24 shrink-0">Date</span>
				<span>{tx.transactionDate}</span>
			</div>
			{#if tx.referenceNo}
				<div class="flex gap-2">
					<span class="text-gray-400 w-24 shrink-0">Reference</span>
					<span>{tx.referenceNo}</span>
				</div>
			{/if}
			{#if location}
				<div class="flex gap-2">
					<span class="text-gray-400 w-24 shrink-0">Location</span>
					<span>{location.name}</span>
				</div>
			{/if}
			{#if category}
				<div class="flex gap-2">
					<span class="text-gray-400 w-24 shrink-0">Category</span>
					<span>{category.name}</span>
				</div>
			{/if}
		</div>

		<!-- Bill To -->
		{#if hasBillTo}
			<div>
				<p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Bill To</p>
				{#if billTo?.name}
					<p class="font-semibold text-gray-900">{billTo.name}</p>
				{/if}
				{#if billTo?.address}
					<p class="text-gray-500 whitespace-pre-line mt-0.5">{billTo.address}</p>
				{/if}
				{#if billTo?.email}
					<p class="text-gray-500 mt-0.5">{billTo.email}</p>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Note / description -->
	{#if tx.note}
		<div class="mb-6 {compact ? 'text-xs' : 'text-sm'} text-gray-700 border-t border-gray-100 pt-4">
			<p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</p>
			<p>{tx.note}</p>
		</div>
	{/if}

	<!-- Line items table OR flat amount -->
	{#if hasItems}
		<div class="mb-6 border border-gray-200 rounded-lg overflow-hidden {compact ? 'text-xs' : 'text-sm'}">
			<table class="w-full">
				<thead>
					<tr class="bg-gray-50 border-b border-gray-200">
						<th class="text-left px-4 py-2.5 font-semibold text-gray-600">Description</th>
						<th class="text-right px-4 py-2.5 font-semibold text-gray-600 w-12">Qty</th>
						<th class="text-right px-4 py-2.5 font-semibold text-gray-600 w-28">Unit Price</th>
						<th class="text-right px-4 py-2.5 font-semibold text-gray-600 w-28">Amount</th>
					</tr>
				</thead>
				<tbody>
					{#each items as item}
						<tr class="border-b border-gray-100 last:border-0">
							<td class="px-4 py-2.5 text-gray-800">{item.description}</td>
							<td class="px-4 py-2.5 text-right text-gray-600">{item.quantity}</td>
							<td class="px-4 py-2.5 text-right text-gray-600">{formatAmount(item.unitPrice, biz.currency)}</td>
							<td class="px-4 py-2.5 text-right text-gray-800">{formatAmount(item.quantity * item.unitPrice, biz.currency)}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr class="bg-gray-50 border-t border-gray-200">
						<td colspan="3" class="px-4 py-3 text-right font-semibold text-gray-600">Total</td>
						<td class="px-4 py-3 text-right font-bold text-gray-900 {compact ? 'text-base' : 'text-lg'}">{formatAmount(itemsTotal, biz.currency)}</td>
					</tr>
				</tfoot>
			</table>
		</div>
	{:else}
		<!-- Flat amount box -->
		<div class="bg-gray-50 rounded-lg {compact ? 'p-3' : 'p-5'} text-right mb-6 border border-gray-200">
			<p class="{compact ? 'text-xs' : 'text-sm'} text-gray-500 mb-1">Total Amount</p>
			<p class="{compact ? 'text-2xl' : 'text-4xl'} font-bold text-gray-900">{amount}</p>
		</div>
	{/if}

	<!-- Featured image -->
	{#if featuredImageId}
		<div class="mb-6">
			<img
				src="/api/businesses/{businessId}/attachments/{featuredImageId}/download"
				alt="Invoice attachment"
				class="w-full max-h-64 object-contain rounded border border-gray-200"
			/>
		</div>
	{/if}

	<!-- Footer -->
	<div class="border-t border-gray-100 pt-3 text-center text-xs text-gray-400">
		Gee Ledger · ledger.nurzerani.com
	</div>
</div>
