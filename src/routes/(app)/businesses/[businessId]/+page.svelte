<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api, formatAmount } from '$lib/client/api.svelte';
	import { Plus, TrendingUp, TrendingDown, Scale, Loader2 } from '@lucide/svelte';

	let { data } = $props();

	type Transaction = {
		id: string;
		type: string;
		amount: number;
		note: string | null;
		transactionDate: string;
		salesChannelId: string | null;
		locationId: string;
		categoryId: string | null;
	};

	let transactions = $state<Transaction[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let totalIncome = $derived(
		transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
	);
	let totalExpense = $derived(
		transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
	);
	let balance = $derived(totalIncome - totalExpense);

	const businessId = $page.params.businessId;

	async function load() {
		try {
			loading = true;
			error = null;
			// Load recent transactions (last 30 days)
			const today = new Date();
			const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
			const to = today.toISOString().slice(0, 10);
			const res = await api.get<{ data: Transaction[]; hasMore: boolean }>(
				`/businesses/${businessId}/transactions?from=${from}&to=${to}&limit=50`
			);
			transactions = res.data;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load data';
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<div class="max-w-3xl">
	<!-- Summary cards -->
	<div class="grid grid-cols-3 gap-3 mb-6">
		<div class="rounded-lg border border-border bg-card p-4">
			<div class="flex items-center gap-2 text-sm text-muted-foreground mb-1">
				<TrendingUp class="size-4 text-green-500" />
				Income
			</div>
			<p class="text-xl font-bold text-green-600">
				{formatAmount(totalIncome, data.business.currency)}
			</p>
			<p class="text-xs text-muted-foreground mt-0.5">This month</p>
		</div>
		<div class="rounded-lg border border-border bg-card p-4">
			<div class="flex items-center gap-2 text-sm text-muted-foreground mb-1">
				<TrendingDown class="size-4 text-red-500" />
				Expense
			</div>
			<p class="text-xl font-bold text-red-600">
				{formatAmount(totalExpense, data.business.currency)}
			</p>
			<p class="text-xs text-muted-foreground mt-0.5">This month</p>
		</div>
		<div class="rounded-lg border border-border bg-card p-4">
			<div class="flex items-center gap-2 text-sm text-muted-foreground mb-1">
				<Scale class="size-4 text-blue-500" />
				Balance
			</div>
			<p class="text-xl font-bold {balance >= 0 ? 'text-foreground' : 'text-red-600'}">
				{formatAmount(balance, data.business.currency)}
			</p>
			<p class="text-xs text-muted-foreground mt-0.5">This month</p>
		</div>
	</div>

	<!-- Recent transactions -->
	<div class="flex items-center justify-between mb-3">
		<h2 class="font-semibold text-foreground">Recent Transactions</h2>
		<a
			href="/businesses/{businessId}/transactions/new"
			class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
		>
			<Plus class="size-4" />
			Add
		</a>
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<Loader2 class="size-7 animate-spin text-muted-foreground" />
		</div>
	{:else if error}
		<p class="text-destructive text-sm py-6 text-center">{error}</p>
	{:else if transactions.length === 0}
		<div class="rounded-lg border border-border bg-card p-8 text-center">
			<p class="text-muted-foreground text-sm">No transactions this month.</p>
			<a
				href="/businesses/{businessId}/transactions/new"
				class="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
			>
				<Plus class="size-4" />
				Record first transaction
			</a>
		</div>
	{:else}
		<div class="rounded-lg border border-border overflow-hidden">
			{#each transactions.slice(0, 10) as tx (tx.id)}
				<div class="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 bg-card hover:bg-muted/50 transition-colors">
					<span
						class="text-xs font-medium px-2 py-0.5 rounded-full
							{tx.type === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
							 tx.type === 'expense' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
							 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}"
					>
						{tx.type}
					</span>
					<div class="flex-1 min-w-0">
						<p class="text-sm text-foreground truncate">{tx.note ?? '—'}</p>
						<p class="text-xs text-muted-foreground">{tx.transactionDate}</p>
					</div>
					<span
						class="text-sm font-semibold shrink-0
							{tx.type === 'income' ? 'text-green-600' :
							 tx.type === 'expense' ? 'text-red-600' : 'text-foreground'}"
					>
						{tx.type === 'expense' ? '−' : '+'}{formatAmount(tx.amount, data.business.currency)}
					</span>
				</div>
			{/each}
		</div>
		{#if transactions.length > 10}
			<div class="text-center mt-3">
				<a href="/businesses/{businessId}/transactions" class="text-sm text-primary hover:underline">
					View all transactions →
				</a>
			</div>
		{/if}
	{/if}
</div>
