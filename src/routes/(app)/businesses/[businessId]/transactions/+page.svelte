<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api, formatAmount } from '$lib/client/api.svelte';
	import { Plus, Loader2, Trash2, Paperclip, ScrollText } from '@lucide/svelte';

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

	const businessId = $page.params.businessId;

	let transactions = $state<Transaction[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let hasMore = $state(false);
	let nextCursor = $state<string | null>(null);

	// Filters
	let filterType = $state('');
	let filterFrom = $state('');
	let filterTo = $state('');

	let deleteId = $state<string | null>(null);
	let deleting = $state(false);

	function buildQuery() {
		const q = new URLSearchParams();
		if (filterType) q.set('type', filterType);
		if (filterFrom) q.set('from', filterFrom);
		if (filterTo) q.set('to', filterTo);
		return q.toString();
	}

	async function loadTransactions(append = false) {
		try {
			if (!append) loading = true;
			error = null;
			const query = buildQuery();
			const res = await api.get<{ data: Transaction[]; hasMore: boolean; nextCursor: string | null }>(
				`/businesses/${businessId}/transactions${query ? '?' + query : ''}`
			);
			transactions = append ? [...transactions, ...res.data] : res.data;
			hasMore = res.hasMore;
			nextCursor = res.nextCursor;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
		}
	}

	async function deleteTransaction(id: string) {
		try {
			deleting = true;
			await api.delete(`/businesses/${businessId}/transactions/${id}`);
			transactions = transactions.filter((t) => t.id !== id);
			deleteId = null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete';
		} finally {
			deleting = false;
		}
	}

	onMount(() => loadTransactions());
</script>

<div>
	<div class="flex items-center justify-between mb-4">
		<h2 class="font-semibold text-foreground">Transactions</h2>
		<div class="flex items-center gap-2">
			<a
				href="/businesses/{businessId}/statement"
				class="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
			>
				<ScrollText class="size-4" />
				Statement
			</a>
			<a
				href="/businesses/{businessId}/transactions/new"
				class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
			>
				<Plus class="size-4" />
				Add
			</a>
		</div>
	</div>

	<!-- Filters -->
	<div class="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 mb-4">
		<select
			bind:value={filterType}
			onchange={() => loadTransactions()}
			class="w-full sm:w-auto rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
		>
			<option value="">All types</option>
			<option value="income">Income</option>
			<option value="expense">Expense</option>
		</select>
		<input
			type="date"
			bind:value={filterFrom}
			onchange={() => loadTransactions()}
			class="w-full sm:w-auto rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
		/>
		<input
			type="date"
			bind:value={filterTo}
			onchange={() => loadTransactions()}
			class="w-full sm:w-auto rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
		/>
	</div>

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
		<div class="rounded-lg border border-border overflow-hidden">
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
							<p class="text-sm font-medium text-foreground truncate">{tx.note ?? '—'}</p>
							<p class="text-xs text-muted-foreground">
							{tx.transactionDate}{#if tx.contactName} · {tx.contactName}{/if}
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

		{#if hasMore}
			<div class="text-center mt-4">
				<button
					onclick={() => loadTransactions(true)}
					class="text-sm text-primary hover:underline"
				>
					Load more
				</button>
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
