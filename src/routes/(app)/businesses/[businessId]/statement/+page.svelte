<script lang="ts">
	import { page } from '$app/stores';
	import { ArrowLeft, Printer, Loader2 } from '@lucide/svelte';
	import StatementPreview from '$lib/components/StatementPreview.svelte';
	import { api } from '$lib/client/api.svelte';

	let { data } = $props();

	const { business: biz, locations } = data;
	const businessId = $page.params.businessId;

	type Transaction = {
		id: string;
		type: string;
		amount: number;
		transactionDate: string;
		note: string | null;
		referenceNo: string | null;
	};

	// Defaults: first day of current month → today
	const today = new Date();
	const todayStr = today.toISOString().slice(0, 10);
	const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

	// Filter controls
	let filterFrom        = $state(firstOfMonth);
	let filterTo          = $state(todayStr);
	let filterLocationId  = $state('');
	let statementTitle    = $state('Statement');
	let referenceNo       = $state('');
	let billToName        = $state('');
	let billToAddress     = $state('');
	let showBalance       = $state(false);

	// Data
	let transactions  = $state<Transaction[]>([]);
	let loading       = $state(false);
	let error         = $state<string | null>(null);
	let loaded        = $state(false);
	let truncated     = $state(false);

	const locationName = $derived(
		filterLocationId ? (locations.find((l: { id: string; name: string }) => l.id === filterLocationId)?.name ?? '') : ''
	);

	const billTo = $derived(
		(billToName || billToAddress)
			? { name: billToName || undefined, address: billToAddress || undefined }
			: undefined
	);

	async function loadStatement() {
		if (!filterFrom || !filterTo) return;
		loading = true;
		error = null;
		truncated = false;
		try {
			const all: Transaction[] = [];
			let cursor: string | null = null;
			let pages = 0;
			do {
				const params = new URLSearchParams({ from: filterFrom, to: filterTo, limit: '100' });
				if (filterLocationId) params.set('locationId', filterLocationId);
				if (cursor) params.set('cursor', cursor);
				const res = await api.get<{ data: Transaction[]; nextCursor: string | null; hasMore: boolean }>(
					`/businesses/${businessId}/transactions?${params}`
				);
				all.push(...res.data);
				cursor = res.nextCursor;
				pages++;
				if (pages >= 10) {
					// Safety cap: max 1000 transactions
					if (res.hasMore) truncated = true;
					break;
				}
			} while (cursor);
			transactions = all.sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));
			loaded = true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load transactions';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Statement — {biz.name}</title>
</svelte:head>

<style>
	@page { margin: 1.5cm; size: A4; }
	@media print {
		.no-print { display: none !important; }
		.print-paper { box-shadow: none !important; }
	}
</style>

<!-- ── Action bar ───────────────────────────────────────────────────────────── -->
<div class="no-print sticky top-0 z-10 bg-card border-b border-border flex items-center gap-2 px-3 sm:px-4 h-14 shrink-0">
	<a
		href="/businesses/{businessId}/transactions"
		class="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
		title="Back to transactions"
	>
		<ArrowLeft class="size-4" />
	</a>

	<span class="text-sm font-medium text-foreground flex-1 truncate min-w-0">
		<span class="hidden sm:inline">{biz.name} / </span><span class="text-muted-foreground">Statement</span>
	</span>

	<button
		onclick={() => window.print()}
		disabled={!loaded || transactions.length === 0}
		class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
	>
		<Printer class="size-3.5" />
		<span class="hidden sm:inline">Print PDF</span>
		<span class="sm:hidden">Print</span>
	</button>
</div>

<!-- ── Desktop layout: side-by-side ────────────────────────────────────────── -->
<div class="no-print hidden md:flex h-[calc(100vh-3.5rem)] overflow-hidden">

	<!-- Left: controls -->
	<div class="w-64 shrink-0 border-r border-border flex flex-col overflow-y-auto bg-card">

		<div class="px-4 py-3 border-b border-border">
			<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Date Range</p>
			<div class="flex flex-col gap-2">
				<div>
					<label class="block text-xs text-muted-foreground mb-1">From</label>
					<input type="date" bind:value={filterFrom}
						class="w-full text-sm text-foreground bg-background border border-input rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring" />
				</div>
				<div>
					<label class="block text-xs text-muted-foreground mb-1">To</label>
					<input type="date" bind:value={filterTo}
						class="w-full text-sm text-foreground bg-background border border-input rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring" />
				</div>
			</div>
		</div>

		{#if locations.length > 0}
			<div class="px-4 py-3 border-b border-border">
				<label class="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Location</label>
				<select bind:value={filterLocationId}
					class="w-full text-sm text-foreground bg-background border border-input rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring">
					<option value="">All locations</option>
					{#each locations as loc (loc.id)}
						<option value={loc.id}>{loc.name}</option>
					{/each}
				</select>
			</div>
		{/if}

		<div class="px-4 py-3 border-b border-border">
			<label class="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Statement Title</label>
			<input type="text" bind:value={statementTitle} placeholder="Statement"
				class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
		</div>

		<div class="px-4 py-3 border-b border-border">
			<label class="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Reference No</label>
			<input type="text" bind:value={referenceNo} placeholder="Optional"
				class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
		</div>

		<div class="px-4 py-3 border-b border-border">
			<label class="flex items-center gap-2 cursor-pointer">
				<input type="checkbox" bind:checked={showBalance} class="rounded border-input accent-primary" />
				<span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Show Balance Column</span>
			</label>
		</div>

		<div class="px-4 py-3 border-b border-border">
			<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prepared For</p>
			<p class="text-xs text-muted-foreground mt-0.5">Appears on the document</p>
		</div>
		<div class="divide-y divide-border">
			<div class="px-4 py-3">
				<label class="block text-xs text-muted-foreground mb-1">Name</label>
				<input type="text" bind:value={billToName} placeholder="Recipient or company"
					class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
			</div>
			<div class="px-4 py-3">
				<label class="block text-xs text-muted-foreground mb-1">Address</label>
				<textarea bind:value={billToAddress} placeholder="Street, city, postcode…" rows="3"
					class="w-full text-sm text-foreground bg-transparent focus:outline-none resize-none"></textarea>
			</div>
		</div>

		<div class="px-4 py-4 mt-auto border-t border-border">
			<button
				onclick={loadStatement}
				disabled={loading}
				class="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
			>
				{#if loading}<Loader2 class="size-4 animate-spin" />{/if}
				{loading ? 'Loading…' : 'Generate Statement'}
			</button>
		</div>
	</div>

	<!-- Right: document viewer -->
	<div class="flex-1 bg-gray-200 overflow-y-auto py-8 px-4 flex justify-center">
		{#if !loaded && !loading}
			<div class="flex items-center justify-center h-full text-sm text-gray-500">
				Set your filters and click <span class="font-medium mx-1">Generate Statement</span> to preview
			</div>
		{:else if loading}
			<div class="flex items-center justify-center h-full">
				<Loader2 class="size-8 animate-spin text-gray-400" />
			</div>
		{:else if error}
			<div class="flex items-center justify-center h-full text-sm text-red-500">{error}</div>
		{:else}
			<div class="w-full max-w-3xl flex flex-col gap-3">
				{#if truncated}
					<p class="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
						Showing first 1,000 transactions. Narrow your date range to see all transactions.
					</p>
				{/if}
				<div class="print-paper bg-white shadow-2xl rounded-sm">
					<StatementPreview
						business={biz}
						{businessId}
						{transactions}
						from={filterFrom}
						to={filterTo}
						title={statementTitle}
						referenceNo={referenceNo || undefined}
						locationName={locationName || undefined}
						billTo={billTo}
						{showBalance}
					/>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- ── Mobile layout: stacked ───────────────────────────────────────────────── -->
<div class="no-print md:hidden overflow-y-auto">

	<!-- Controls card -->
	<div class="bg-card border-b border-border">
		<div class="grid grid-cols-2 divide-x divide-border border-b border-border">
			<div class="px-4 py-3">
				<label class="block text-xs text-muted-foreground mb-1">From</label>
				<input type="date" bind:value={filterFrom}
					class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
			</div>
			<div class="px-4 py-3">
				<label class="block text-xs text-muted-foreground mb-1">To</label>
				<input type="date" bind:value={filterTo}
					class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
			</div>
		</div>

		{#if locations.length > 0}
			<div class="px-4 py-3 border-b border-border">
				<label class="block text-xs text-muted-foreground mb-1">Location</label>
				<select bind:value={filterLocationId}
					class="w-full text-sm text-foreground bg-transparent focus:outline-none">
					<option value="">All locations</option>
					{#each locations as loc (loc.id)}
						<option value={loc.id}>{loc.name}</option>
					{/each}
				</select>
			</div>
		{/if}

		<div class="grid grid-cols-2 divide-x divide-border border-b border-border">
			<div class="px-4 py-3">
				<label class="block text-xs text-muted-foreground mb-1">Title</label>
				<input type="text" bind:value={statementTitle} placeholder="Statement"
					class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
			</div>
			<div class="px-4 py-3">
				<label class="block text-xs text-muted-foreground mb-1">Reference No</label>
				<input type="text" bind:value={referenceNo} placeholder="Optional"
					class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
			</div>
		</div>

		<div class="grid grid-cols-2 divide-x divide-border border-b border-border">
			<div class="px-4 py-3">
				<label class="block text-xs text-muted-foreground mb-1">Prepared For</label>
				<input type="text" bind:value={billToName} placeholder="Name"
					class="w-full text-sm text-foreground bg-transparent focus:outline-none" />
			</div>
			<div class="px-4 py-3">
				<label class="block text-xs text-muted-foreground mb-1">Address</label>
				<textarea bind:value={billToAddress} placeholder="Address" rows="2"
					class="w-full text-sm text-foreground bg-transparent focus:outline-none resize-none"></textarea>
			</div>
		</div>

		<div class="px-4 py-3">
			<button
				onclick={loadStatement}
				disabled={loading}
				class="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
			>
				{#if loading}<Loader2 class="size-4 animate-spin" />{/if}
				{loading ? 'Loading…' : 'Generate Statement'}
			</button>
		</div>
	</div>

	<!-- Preview -->
	{#if loaded && !loading && !error}
		<div class="bg-gray-100 px-3 py-5">
			{#if truncated}
				<p class="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3">
					Showing first 1,000 transactions. Narrow your date range to see all.
				</p>
			{/if}
			<div class="overflow-x-auto">
			<div class="print-paper bg-white shadow-md rounded-sm" style="min-width: min-content">
				<StatementPreview
					business={biz}
					{businessId}
					{transactions}
					from={filterFrom}
					to={filterTo}
					title={statementTitle}
					referenceNo={referenceNo || undefined}
					locationName={locationName || undefined}
					billTo={billTo}
					{showBalance}
					compact={true}
				/>
			</div>
			</div>
		</div>
	{:else if loading}
		<div class="flex items-center justify-center py-16">
			<Loader2 class="size-8 animate-spin text-muted-foreground" />
		</div>
	{:else if error}
		<div class="text-center py-16 text-sm text-destructive px-4">{error}</div>
	{/if}
</div>

<!-- ── Print-only output ─────────────────────────────────────────────────────── -->
<div class="hidden print:block">
	<StatementPreview
		business={biz}
		{businessId}
		{transactions}
		from={filterFrom}
		to={filterTo}
		title={statementTitle}
		referenceNo={referenceNo || undefined}
		locationName={locationName || undefined}
		billTo={billTo}
		{showBalance}
	/>
</div>
