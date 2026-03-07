<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api, formatAmount } from '$lib/client/api.svelte';
	import { Plus, Loader2, Trash2 } from '@lucide/svelte';
	import { DateRangeFilter } from '$lib/components/ui/date-picker';
	import * as Select from '$lib/components/ui/select';
	import * as Pagination from '$lib/components/ui/pagination';

	let { data } = $props();

	type Quote = {
		id: string;
		amount: number;
		note: string | null;
		referenceNo: string | null;
		quoteNo: string | null;
		quoteDate: string;
		expiryDate: string | null;
		status: string;
		contactId: string | null;
		contactName: string | null;
	};

	const businessId = $page.params.businessId!;

	let quotes = $state<Quote[]>([]);
	let loading = $state(true);
	let fetching = $state(false);
	let error = $state<string | null>(null);
	let totalCount = $state(0);
	let currentPage = $state(1);
	let perPage = $state(10);

	// Filters
	let filterStatus = $state('');
	let filterFrom = $state('');
	let filterTo = $state('');

	let deleteId = $state<string | null>(null);
	let deleting = $state(false);

	const statusColors: Record<string, string> = {
		draft: 'bg-muted text-muted-foreground',
		sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
		accepted: 'bg-success-bg text-success-fg',
		rejected: 'bg-destructive/15 text-destructive',
		expired: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
	};

	function buildQuery() {
		const q = new URLSearchParams();
		if (filterStatus) q.set('status', filterStatus);
		if (filterFrom) q.set('from', filterFrom);
		if (filterTo) q.set('to', filterTo);
		q.set('page', String(currentPage));
		q.set('perPage', String(perPage));
		return q.toString();
	}

	async function loadQuotes(isInitial = false) {
		try {
			if (isInitial) loading = true;
			fetching = true;
			error = null;
			const query = buildQuery();
			const res = await api.get<{ data: Quote[]; total: number; page: number; perPage: number }>(
				`/businesses/${businessId}/quotes?${query}`
			);
			quotes = res.data;
			totalCount = res.total;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
			fetching = false;
		}
	}

	async function deleteQuote(id: string) {
		try {
			deleting = true;
			await api.delete(`/businesses/${businessId}/quotes/${id}`);
			quotes = quotes.filter((q) => q.id !== id);
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
		loadQuotes();
	}

	function changePerPage(value: string) {
		perPage = Number(value);
		currentPage = 1;
		loadQuotes();
	}

	onMount(() => loadQuotes(true));
</script>

<div>
	<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
		<h2 class="font-semibold text-foreground">Quotes</h2>
		<div class="flex items-center gap-2">
			<a
				href="/businesses/{businessId}/quotes/new"
				class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
			>
				<Plus class="size-3.5" />
				New Quote
			</a>
		</div>
	</div>

	<!-- Filters -->
	<div class="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 mb-4 items-center">
		<Select.Root type="single" value={filterStatus} onValueChange={(v) => { filterStatus = v ?? ''; currentPage = 1; loadQuotes(); }}>
			<Select.Trigger class="w-full sm:w-auto">
				{filterStatus ? filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1) : 'All statuses'}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="">All statuses</Select.Item>
				<Select.Item value="draft">Draft</Select.Item>
				<Select.Item value="sent">Sent</Select.Item>
				<Select.Item value="accepted">Accepted</Select.Item>
				<Select.Item value="rejected">Rejected</Select.Item>
				<Select.Item value="expired">Expired</Select.Item>
			</Select.Content>
		</Select.Root>
		<DateRangeFilter
			bind:from={filterFrom}
			bind:to={filterTo}
			onchange={() => { currentPage = 1; loadQuotes(); }}
			class="w-full sm:w-auto"
		/>
	</div>

	{#if loading}
		<div class="flex justify-center py-16"><Loader2 class="size-7 animate-spin text-muted-foreground" /></div>
	{:else if error}
		<p class="text-destructive text-sm text-center py-8">{error}</p>
	{:else if quotes.length === 0}
		<div class="rounded-lg border border-border bg-card p-10 text-center">
			<p class="text-muted-foreground text-sm">No quotes found.</p>
			<a
				href="/businesses/{businessId}/quotes/new"
				class="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
			>
				<Plus class="size-4" />
				Create a quote
			</a>
		</div>
	{:else}
		<div class="rounded-lg border border-border overflow-hidden transition-opacity" class:opacity-50={fetching}>
			{#each quotes as q (q.id)}
				<div class="flex items-center border-b border-border last:border-0 bg-card hover:bg-muted/30 transition-colors">
					<a
						href="/businesses/{businessId}/quotes/{q.id}"
						class="flex items-center gap-3 px-4 py-3 flex-1 min-w-0"
					>
						<span
							class="text-xs font-medium px-2 py-0.5 rounded-full shrink-0 {statusColors[q.status] ?? 'bg-muted text-muted-foreground'}"
						>
							{q.status}
						</span>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-foreground truncate">
								{q.quoteNo ?? q.note ?? q.firstItemDescription ?? '—'}
							</p>
							<p class="text-xs text-muted-foreground">
								{new Date(q.quoteDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}{#if q.contactName} · {q.contactName}{/if}
							</p>
						</div>
						<span class="text-sm font-semibold shrink-0 text-foreground">
							{formatAmount(q.amount, data.business.currency)}
						</span>
					</a>
					<div class="flex items-center gap-1 px-2 shrink-0">
						<button
							onclick={() => (deleteId = q.id)}
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
			<h3 class="font-semibold text-foreground mb-2">Delete Quote?</h3>
			<p class="text-sm text-muted-foreground mb-5">This action cannot be undone.</p>
			<div class="flex justify-end gap-2">
				<button
					onclick={() => (deleteId = null)}
					class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
				>
					Cancel
				</button>
				<button
					onclick={() => deleteQuote(deleteId!)}
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
