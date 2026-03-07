<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api, formatAmount } from '$lib/client/api.svelte';
	import { Plus, Loader2, Trash2, Paperclip, ScrollText, Download, Crown, X } from '@lucide/svelte';
	import { PLAN_KEY } from '$lib/configurations/plans';
	import { DateRangeFilter } from '$lib/components/ui/date-picker';
	import * as Select from '$lib/components/ui/select';
	import * as Pagination from '$lib/components/ui/pagination';

	let { data } = $props();

	type Transaction = {
		id: string;
		type: string;
		amount: number;
		note: string | null;
		referenceNo: string | null;
		transactionDate: string;
		salesChannelId: string | null;
		locationId: string;
		categoryId: string | null;
		contactId: string | null;
		contactName: string | null;
		attachmentCount: number;
	};

	const businessId = $page.params.businessId!;
	const canExport = $derived(
		($page.data.navBusinesses as { id: string; planKey: string }[])
			?.find((b) => b.id === businessId)?.planKey === PLAN_KEY.PRO
	);

	let transactions = $state<Transaction[]>([]);
	let loading = $state(true);
	let fetching = $state(false);
	let error = $state<string | null>(null);
	let totalCount = $state(0);
	let currentPage = $state(1);
	let perPage = $state(10);

	// Filters
	let filterContactId = $state($page.url.searchParams.get('contactId') ?? '');
	let filterContactName = $state('');
	let filterType = $state('');
	let filterFrom = $state('');
	let filterTo = $state('');

	let deleteId = $state<string | null>(null);
	let deleting = $state(false);

	function exportUrl() {
		const q = new URLSearchParams();
		if (filterType) q.set('type', filterType);
		if (filterFrom) q.set('from', filterFrom);
		if (filterTo) q.set('to', filterTo);
		q.set('currency', data.business?.currency ?? 'USD');
		return `/api/businesses/${businessId}/transactions/export?${q}`;
	}

	function buildQuery() {
		const q = new URLSearchParams();
		if (filterContactId) q.set('contactId', filterContactId);
		if (filterType) q.set('type', filterType);
		if (filterFrom) q.set('from', filterFrom);
		if (filterTo) q.set('to', filterTo);
		q.set('page', String(currentPage));
		q.set('perPage', String(perPage));
		return q.toString();
	}

	async function loadTransactions(isInitial = false) {
		try {
			if (isInitial) loading = true;
			fetching = true;
			error = null;
			const query = buildQuery();
			const res = await api.get<{ data: Transaction[]; total: number; page: number; perPage: number }>(
				`/businesses/${businessId}/transactions?${query}`
			);
			transactions = res.data;
			totalCount = res.total;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
			fetching = false;
		}
	}

	async function deleteTransaction(id: string) {
		try {
			deleting = true;
			await api.delete(`/businesses/${businessId}/transactions/${id}`);
			transactions = transactions.filter((t) => t.id !== id);
			totalCount = Math.max(0, totalCount - 1);
			deleteId = null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete';
		} finally {
			deleting = false;
		}
	}

	function goToPage(p: number) {
		currentPage = p;
		loadTransactions();
	}

	function changePerPage(value: string) {
		perPage = Number(value);
		currentPage = 1;
		loadTransactions();
	}

	function clearContactFilter() {
		filterContactId = '';
		filterContactName = '';
		currentPage = 1;
		const url = new URL(window.location.href);
		url.searchParams.delete('contactId');
		window.history.replaceState({}, '', url.toString());
		loadTransactions();
	}

	onMount(async () => {
		if (filterContactId) {
			try {
				const c = await api.get<{ name: string }>(`/businesses/${businessId}/contacts/${filterContactId}`);
				filterContactName = c.name;
			} catch {}
		}
		loadTransactions(true);
	});
</script>

<div>
	<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
		<h2 class="font-semibold text-foreground">Transactions</h2>
		<div class="flex items-center gap-2">
			{#if canExport}
				<a
					href={exportUrl()}
					class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
				>
					<Download class="size-3.5" />
					<span class="hidden sm:inline">Export</span>
				</a>
			{:else}
				<button
					disabled
					class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-input bg-background text-sm font-medium text-muted-foreground opacity-60 cursor-not-allowed"
					title="Upgrade to Pro to export data"
				>
					<Download class="size-3.5" />
					<span class="hidden sm:inline">Export</span>
					<Crown class="size-3 text-amber-500" />
				</button>
			{/if}
			<a
				href="/businesses/{businessId}/statement"
				class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
			>
				<ScrollText class="size-3.5" />
				<span class="hidden sm:inline">Statement</span>
			</a>
			<a
				href="/businesses/{businessId}/transactions/new"
				class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
			>
				<Plus class="size-3.5" />
				Add
			</a>
		</div>
	</div>

	<!-- Filters -->
	{#if filterContactId}
		<div class="flex items-center gap-2 mb-3">
			<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-sm text-foreground">
				Contact: <span class="font-medium">{filterContactName || 'Loading…'}</span>
				<button onclick={clearContactFilter} class="p-0.5 rounded-full hover:bg-background/80 text-muted-foreground hover:text-foreground">
					<X class="size-3" />
				</button>
			</span>
		</div>
	{/if}
	<div class="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 mb-4 items-center">
		<Select.Root type="single" value={filterType} onValueChange={(v) => { filterType = v ?? ''; currentPage = 1; loadTransactions(); }}>
			<Select.Trigger class="w-full sm:w-auto">
				{filterType ? filterType.charAt(0).toUpperCase() + filterType.slice(1) : 'All types'}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="">All types</Select.Item>
				<Select.Item value="income">Income</Select.Item>
				<Select.Item value="expense">Expense</Select.Item>
			</Select.Content>
		</Select.Root>
		<DateRangeFilter
			bind:from={filterFrom}
			bind:to={filterTo}
			onchange={() => { currentPage = 1; loadTransactions(); }}
			class="w-full sm:w-auto"
		/>
	</div>

	{#if filterFrom || filterTo}
		<p class="text-xs text-muted-foreground mb-3">
			Showing transactions
			{#if filterFrom && filterTo}
				from <span class="font-medium text-foreground">{new Date(filterFrom).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
				to <span class="font-medium text-foreground">{new Date(filterTo).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
			{:else if filterFrom}
				from <span class="font-medium text-foreground">{new Date(filterFrom).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
			{:else}
				until <span class="font-medium text-foreground">{new Date(filterTo).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
			{/if}
		</p>
	{/if}

	{#if loading}
		<div class="flex justify-center py-16"><Loader2 class="size-7 animate-spin text-muted-foreground" /></div>
	{:else if error}
		<p class="text-destructive text-sm text-center py-8">{error}</p>
	{:else if transactions.length === 0}
		<div class="rounded-lg border border-border bg-card p-10 text-center">
			<p class="text-muted-foreground text-sm">No transactions found.</p>
			<a
				href="/businesses/{businessId}/transactions/new"
				class="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
			>
				<Plus class="size-4" />
				Record a transaction
			</a>
		</div>
	{:else}
		<div class="rounded-lg border border-border overflow-hidden transition-opacity" class:opacity-50={fetching}>
			{#each transactions as tx (tx.id)}
				<div class="flex items-center border-b border-border last:border-0 bg-card hover:bg-muted/30 transition-colors">
					<a
						href="/businesses/{businessId}/transactions/{tx.id}"
						class="flex items-center gap-3 px-4 py-3 flex-1 min-w-0"
					>
						<span
							class="text-xs font-medium px-2 py-0.5 rounded-full shrink-0
								{tx.type === 'income' ? 'bg-success-bg text-success-fg' :
								 tx.type === 'expense' ? 'bg-destructive/15 text-destructive' :
								 'bg-info-bg text-info-fg'}"
						>
							{tx.type}
						</span>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-foreground truncate">{tx.note ?? tx.firstItemDescription ?? '—'}</p>
							<p class="text-xs text-muted-foreground">
							{new Date(tx.transactionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}{#if tx.contactName} · {tx.contactName}{/if}
						</p>
						</div>
						<span
							class="text-sm font-semibold shrink-0
								{tx.type === 'income' ? 'text-success-fg' :
								 tx.type === 'expense' ? 'text-destructive' : 'text-foreground'}"
						>
							{tx.type === 'expense' ? '−' : '+'}{formatAmount(tx.amount, data.business.currency)}
						</span>
						{#if tx.attachmentCount > 0}
							<span class="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
								<Paperclip class="size-3" />
								{tx.attachmentCount}
							</span>
						{/if}
					</a>
					<div class="flex items-center gap-1 px-2 shrink-0">
						<button
							onclick={() => (deleteId = tx.id)}
							class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
							title="Delete"
						>
							<Trash2 class="size-3.5" />
						</button>
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalCount > 0}
			<div class="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<span>Rows per page</span>
					<Select.Root type="single" value={String(perPage)} onValueChange={(v) => { if (v) changePerPage(v); }}>
						<Select.Trigger class="w-[70px] h-8 text-sm">
							{perPage}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="10">10</Select.Item>
							<Select.Item value="20">20</Select.Item>
							<Select.Item value="50">50</Select.Item>
							<Select.Item value="100">100</Select.Item>
						</Select.Content>
					</Select.Root>
					<span class="text-xs whitespace-nowrap">
						{(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, totalCount)} of {totalCount}
					</span>
				</div>
				<Pagination.Root count={totalCount} {perPage} bind:page={currentPage} onPageChange={(p) => goToPage(p)} siblingCount={1}>
					{#snippet children({ pages })}
						<Pagination.Content>
							<Pagination.Item>
								<Pagination.Previous />
							</Pagination.Item>
							{#each pages as p (p.key)}
								{#if p.type === 'ellipsis'}
									<Pagination.Item>
										<Pagination.Ellipsis />
									</Pagination.Item>
								{:else}
									<Pagination.Item>
										<Pagination.Link page={p} isActive={currentPage === p.value} />
									</Pagination.Item>
								{/if}
							{/each}
							<Pagination.Item>
								<Pagination.Next />
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</div>
		{/if}
	{/if}
</div>

<!-- Delete confirmation -->
{#if deleteId}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
		<div class="bg-card rounded-lg border border-border p-6 max-w-sm w-full shadow-lg">
			<h3 class="font-semibold text-foreground mb-2">Delete Transaction?</h3>
			<p class="text-sm text-muted-foreground mb-5">This action cannot be undone.</p>
			<div class="flex justify-end gap-2">
				<button
					onclick={() => (deleteId = null)}
					class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
				>
					Cancel
				</button>
				<button
					onclick={() => deleteTransaction(deleteId!)}
					disabled={deleting}
					class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50"
				>
					{#if deleting}<Loader2 class="size-4 animate-spin" />{/if}
					Delete
				</button>
			</div>
		</div>
	</div>
{/if}
