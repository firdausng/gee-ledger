<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api, formatAmount } from '$lib/client/api.svelte';
	import { Plus, TrendingUp, TrendingDown, Scale, Loader2, AlertTriangle, Clock, Percent } from '@lucide/svelte';
	import { DateRangePicker } from '$lib/components/ui/date-picker';

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

	type TrendRow = { period: string; income: number; expense: number };
	type CategoryRow = { categoryId: string; categoryName: string; type: string; total: number };
	type DueInvoice = { id: string; type: string; amount: number; note: string | null; dueDate: string; contactName: string | null };

	type Period = 'week' | 'month' | 'year' | 'custom';

	// ─── Filter state from URL params ──────────────────────────────────────
	let activePeriod = $derived<Period>(
		(['week', 'month', 'year', 'custom'].includes($page.url.searchParams.get('period') ?? '')
			? $page.url.searchParams.get('period') as Period
			: 'month')
	);
	let customFrom = $derived($page.url.searchParams.get('from') ?? '');
	let customTo = $derived($page.url.searchParams.get('to') ?? '');

	// Local input state for custom date range
	let customFromInput = $state('');
	let customToInput = $state('');

	function getDateRange(period: Period): { from: string; to: string; groupBy: 'day' | 'month' } {
		const today = new Date();
		const toStr = today.toISOString().slice(0, 10);

		switch (period) {
			case 'week': {
				const day = today.getDay();
				const diff = day === 0 ? 6 : day - 1; // Monday = 0
				const monday = new Date(today);
				monday.setDate(today.getDate() - diff);
				return { from: monday.toISOString().slice(0, 10), to: toStr, groupBy: 'day' };
			}
			case 'month': {
				const first = new Date(today.getFullYear(), today.getMonth(), 1);
				return { from: first.toISOString().slice(0, 10), to: toStr, groupBy: 'day' };
			}
			case 'year': {
				const first = new Date(today.getFullYear(), 0, 1);
				return { from: first.toISOString().slice(0, 10), to: toStr, groupBy: 'month' };
			}
			case 'custom': {
				const from = customFrom || toStr;
				const to = customTo || toStr;
				const days = Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
				return { from, to, groupBy: days > 31 ? 'month' : 'day' };
			}
		}
	}

	let dateRange = $derived(getDateRange(activePeriod));

	let periodLabel = $derived.by(() => {
		switch (activePeriod) {
			case 'week': return 'This week';
			case 'month': return 'This month';
			case 'year': return 'This year';
			case 'custom': return customFrom && customTo ? `${customFrom} — ${customTo}` : 'Custom range';
		}
	});

	// ─── Data state ─────────────────────────────────────────────────────────
	let transactions = $state<Transaction[]>([]);
	let trend = $state<TrendRow[]>([]);
	let categoryBreakdown = $state<CategoryRow[]>([]);
	let pastDue = $state<DueInvoice[]>([]);
	let upcoming = $state<DueInvoice[]>([]);
	let loading = $state(true);
	let statsLoading = $state(true);
	let error = $state<string | null>(null);

	let totalIncome = $derived(trend.reduce((s, t) => s + t.income, 0));
	let totalExpense = $derived(trend.reduce((s, t) => s + t.expense, 0));
	let balance = $derived(totalIncome - totalExpense);
	let profitMargin = $derived(totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0);

	let businessId = $derived($page.params.businessId!);

	async function loadRecentTransactions(bizId: string) {
		try {
			loading = true;
			const today = new Date();
			const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
			const to = today.toISOString().slice(0, 10);
			const res = await api.get<{ data: Transaction[]; hasMore: boolean }>(
				`/businesses/${bizId}/transactions?from=${from}&to=${to}&limit=50`
			);
			transactions = res.data;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load data';
		} finally {
			loading = false;
		}
	}

	async function loadStats(bizId: string, range: { from: string; to: string; groupBy: 'day' | 'month' }) {
		try {
			statsLoading = true;
			const q = new URLSearchParams({
				from: range.from,
				to: range.to,
				groupBy: range.groupBy
			});
			const res = await api.get<{ trend: TrendRow[]; categoryBreakdown: CategoryRow[]; pastDue: DueInvoice[]; upcoming: DueInvoice[] }>(
				`/businesses/${bizId}/dashboard-stats?${q}`
			);
			trend = res.trend;
			categoryBreakdown = res.categoryBreakdown;
			pastDue = res.pastDue;
			upcoming = res.upcoming;
		} catch {
			trend = [];
			categoryBreakdown = [];
			pastDue = [];
			upcoming = [];
		} finally {
			statsLoading = false;
		}
	}

	function setPeriod(period: Period) {
		const params = new URLSearchParams();
		params.set('period', period);
		if (period === 'custom' && customFromInput && customToInput) {
			params.set('from', customFromInput);
			params.set('to', customToInput);
		}
		goto(`?${params}`, { replaceState: true, keepFocus: true });
	}

	function applyCustomRange() {
		if (!customFromInput || !customToInput) return;
		const params = new URLSearchParams();
		params.set('period', 'custom');
		params.set('from', customFromInput);
		params.set('to', customToInput);
		goto(`?${params}`, { replaceState: true, keepFocus: true });
	}

	function onCustomRangeChange() {
		if (customFromInput && customToInput) {
			applyCustomRange();
		}
	}

	// Reload stats when businessId or date range changes
	$effect(() => {
		loadStats(businessId, dateRange);
	});

	// Reload recent transactions when businessId changes
	$effect(() => {
		loadRecentTransactions(businessId);
	});

	onMount(() => {
		// Initialize custom inputs from URL params
		if (customFrom) customFromInput = customFrom;
		if (customTo) customToInput = customTo;
	});

	// ─── Chart helpers ──────────────────────────────────────────────────────
	const chartColors = [
		'var(--color-chart-1)',
		'var(--color-chart-2)',
		'var(--color-chart-3)',
		'var(--color-chart-4)',
		'var(--color-chart-5)',
		'var(--color-muted-foreground)'
	];

	function formatPeriodLabel(period: string): string {
		if (period.length === 7) {
			const [y, m] = period.split('-');
			const date = new Date(Number(y), Number(m) - 1, 1);
			return date.toLocaleDateString('en', { month: 'short' });
		}
		const date = new Date(period + 'T00:00:00');
		return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
	}

	let trendMax = $derived(Math.max(...trend.map((t) => Math.max(t.income, t.expense)), 1));
	let incomeCategories = $derived(categoryBreakdown.filter((c) => c.type === 'income'));
	let expenseCategories = $derived(categoryBreakdown.filter((c) => c.type === 'expense'));
	let incomeMax = $derived(Math.max(...incomeCategories.map((c) => c.total), 1));
	let expenseMax = $derived(Math.max(...expenseCategories.map((c) => c.total), 1));

	const currency = $derived(data.business.currency);

	function daysFromToday(dateStr: string): number {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const target = new Date(dateStr + 'T00:00:00');
		return Math.round((target.getTime() - today.getTime()) / 86400000);
	}
</script>

<div>
	<!-- Period filter -->
	<div class="flex flex-wrap items-center gap-2 mb-4">
		{#each ['week', 'month', 'year', 'custom'] as period (period)}
			<button
				onclick={() => setPeriod(period as Period)}
				class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors
					{activePeriod === period
					? 'bg-primary text-primary-foreground'
					: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
			>
				{period.charAt(0).toUpperCase() + period.slice(1)}
			</button>
		{/each}

		{#if activePeriod === 'custom'}
			<DateRangePicker
				bind:from={customFromInput}
				bind:to={customToInput}
				onchange={onCustomRangeChange}
				class="w-auto"
			/>
		{/if}
	</div>

	<!-- Summary cards -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
		<div class="rounded-lg border border-border bg-card p-3 sm:p-4">
			<div class="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mb-1">
				<TrendingUp class="size-3.5 sm:size-4 text-success-fg shrink-0" />
				<span>Income</span>
			</div>
			<p class="text-sm sm:text-xl font-bold text-success-fg">
				{statsLoading ? '—' : formatAmount(totalIncome, currency)}
			</p>
			<p class="text-xs text-muted-foreground mt-0.5">{periodLabel}</p>
		</div>
		<div class="rounded-lg border border-border bg-card p-3 sm:p-4">
			<div class="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mb-1">
				<TrendingDown class="size-3.5 sm:size-4 text-destructive shrink-0" />
				<span>Expense</span>
			</div>
			<p class="text-sm sm:text-xl font-bold text-destructive">
				{statsLoading ? '—' : formatAmount(totalExpense, currency)}
			</p>
			<p class="text-xs text-muted-foreground mt-0.5">{periodLabel}</p>
		</div>
		<div class="rounded-lg border border-border bg-card p-3 sm:p-4">
			<div class="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mb-1">
				<Scale class="size-3.5 sm:size-4 text-info-fg shrink-0" />
				<span>Balance</span>
			</div>
			<p class="text-sm sm:text-xl font-bold {balance >= 0 ? 'text-foreground' : 'text-destructive'}">
				{statsLoading ? '—' : formatAmount(balance, currency)}
			</p>
			<p class="text-xs text-muted-foreground mt-0.5">{periodLabel}</p>
		</div>
		<div class="rounded-lg border border-border bg-card p-3 sm:p-4">
			<div class="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mb-1">
				<Percent class="size-3.5 sm:size-4 shrink-0 {profitMargin >= 0 ? 'text-success-fg' : 'text-destructive'}" />
				<span>Margin</span>
			</div>
			<p class="text-sm sm:text-xl font-bold {profitMargin >= 0 ? 'text-success-fg' : 'text-destructive'}">
				{statsLoading ? '—' : `${profitMargin.toFixed(1)}%`}
			</p>
			<p class="text-xs text-muted-foreground mt-0.5">{periodLabel}</p>
		</div>
	</div>

	<!-- Past Due & Upcoming -->
	{#if !statsLoading && (pastDue.length > 0 || upcoming.length > 0)}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
			{#if pastDue.length > 0}
				<div class="rounded-lg border border-destructive/30 bg-card p-4">
					<div class="flex items-center gap-2 mb-3">
						<AlertTriangle class="size-4 text-destructive" />
						<h3 class="text-sm font-semibold text-destructive">Past Due</h3>
						<span class="text-xs px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">{pastDue.length}</span>
					</div>
					<div class="flex flex-col gap-1">
						{#each pastDue as inv (inv.id)}
							{@const days = Math.abs(daysFromToday(inv.dueDate))}
							<a
								href="/businesses/{businessId}/transactions/{inv.id}"
								class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors -mx-1"
							>
								<div class="flex-1 min-w-0">
									<p class="text-sm text-foreground truncate">{inv.contactName ?? inv.note ?? '—'}</p>
									<p class="text-xs text-destructive">{days} day{days !== 1 ? 's' : ''} overdue</p>
								</div>
								<span class="text-sm font-semibold tabular-nums shrink-0 {inv.type === 'income' ? 'text-success-fg' : 'text-destructive'}">
									{formatAmount(inv.amount, currency)}
								</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}
			{#if upcoming.length > 0}
				<div class="rounded-lg border border-border bg-card p-4">
					<div class="flex items-center gap-2 mb-3">
						<Clock class="size-4 text-muted-foreground" />
						<h3 class="text-sm font-semibold text-foreground">Upcoming Due</h3>
						<span class="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{upcoming.length}</span>
					</div>
					<div class="flex flex-col gap-1">
						{#each upcoming as inv (inv.id)}
							{@const days = daysFromToday(inv.dueDate)}
							<a
								href="/businesses/{businessId}/transactions/{inv.id}"
								class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors -mx-1"
							>
								<div class="flex-1 min-w-0">
									<p class="text-sm text-foreground truncate">{inv.contactName ?? inv.note ?? '—'}</p>
									<p class="text-xs text-muted-foreground">
										{#if days === 0}Due today
										{:else}Due in {days} day{days !== 1 ? 's' : ''}
										{/if}
									</p>
								</div>
								<span class="text-sm font-semibold tabular-nums shrink-0 {inv.type === 'income' ? 'text-success-fg' : 'text-destructive'}">
									{formatAmount(inv.amount, currency)}
								</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Charts -->
	{#if statsLoading}
		<div class="flex justify-center py-12">
			<Loader2 class="size-7 animate-spin text-muted-foreground" />
		</div>
	{:else if trend.length > 0 || categoryBreakdown.length > 0}
		<div class="flex flex-col gap-4 mb-6">
			<!-- Trend Bar Chart -->
			{#if trend.length > 0}
				<div class="rounded-lg border border-border bg-card p-4">
					<h3 class="text-sm font-semibold text-foreground mb-3">Income vs Expense</h3>
					<div class="flex items-end gap-1 h-[200px]">
						{#each trend as row}
							<div class="flex-1 flex flex-col items-center gap-0.5 h-full justify-end min-w-0">
								<div class="w-full flex gap-px justify-center flex-1 items-end">
									<div
										class="flex-1 rounded-t-sm bg-[var(--color-chart-2)] max-w-5 transition-all"
										style:height="{Math.max((row.income / trendMax) * 100, row.income > 0 ? 2 : 0)}%"
										title="Income: {formatAmount(row.income, currency)}"
									></div>
									<div
										class="flex-1 rounded-t-sm bg-[var(--color-chart-5)] max-w-5 transition-all"
										style:height="{Math.max((row.expense / trendMax) * 100, row.expense > 0 ? 2 : 0)}%"
										title="Expense: {formatAmount(row.expense, currency)}"
									></div>
								</div>
								<span class="text-[10px] text-muted-foreground truncate w-full text-center">
									{formatPeriodLabel(row.period)}
								</span>
							</div>
						{/each}
					</div>
					<div class="flex items-center gap-4 mt-3 justify-center">
						<div class="flex items-center gap-1.5 text-xs">
							<span class="size-2.5 rounded-sm bg-[var(--color-chart-2)]"></span>
							<span class="text-muted-foreground">Income</span>
						</div>
						<div class="flex items-center gap-1.5 text-xs">
							<span class="size-2.5 rounded-sm bg-[var(--color-chart-5)]"></span>
							<span class="text-muted-foreground">Expense</span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Category Breakdown — side by side -->
			{#if incomeCategories.length > 0 || expenseCategories.length > 0}
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<!-- Income by Category -->
					{#if incomeCategories.length > 0}
						<div class="rounded-lg border border-border bg-card p-4">
							<h3 class="text-sm font-semibold text-foreground mb-3">Income by Category</h3>
							<div class="flex flex-col gap-2.5">
								{#each incomeCategories as cat, i}
									<a href="/businesses/{businessId}/transactions?categoryId={cat.categoryId}" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
										<span class="size-2.5 rounded-sm shrink-0" style:background={chartColors[i % chartColors.length]}></span>
										<span class="text-xs text-muted-foreground truncate flex-1 min-w-0">{cat.categoryName}</span>
										<span class="text-xs font-medium tabular-nums shrink-0">{formatAmount(cat.total, currency)}</span>
									</a>
									<div class="h-2 rounded-full bg-muted overflow-hidden -mt-1">
										<div
											class="h-full rounded-full transition-all"
											style:width="{(cat.total / incomeMax) * 100}%"
											style:background={chartColors[i % chartColors.length]}
										></div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Expense by Category -->
					{#if expenseCategories.length > 0}
						<div class="rounded-lg border border-border bg-card p-4">
							<h3 class="text-sm font-semibold text-foreground mb-3">Expense by Category</h3>
							<div class="flex flex-col gap-2.5">
								{#each expenseCategories as cat, i}
									<a href="/businesses/{businessId}/transactions?categoryId={cat.categoryId}" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
										<span class="size-2.5 rounded-sm shrink-0" style:background={chartColors[i % chartColors.length]}></span>
										<span class="text-xs text-muted-foreground truncate flex-1 min-w-0">{cat.categoryName}</span>
										<span class="text-xs font-medium tabular-nums shrink-0">{formatAmount(cat.total, currency)}</span>
									</a>
									<div class="h-2 rounded-full bg-muted overflow-hidden -mt-1">
										<div
											class="h-full rounded-full transition-all"
											style:width="{(cat.total / expenseMax) * 100}%"
											style:background={chartColors[i % chartColors.length]}
										></div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

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
				<a
					href="/businesses/{businessId}/transactions/{tx.id}"
					class="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 bg-card hover:bg-muted/50 transition-colors"
				>
					<span
						class="text-xs font-medium px-2 py-0.5 rounded-full shrink-0
							{tx.type === 'income' ? 'bg-success-bg text-success-fg' : 'bg-destructive/15 text-destructive'}"
					>
						{tx.type}
					</span>
					<div class="flex-1 min-w-0">
						<p class="text-sm text-foreground truncate">{tx.note ?? '—'}</p>
						<p class="text-xs text-muted-foreground">{tx.transactionDate}</p>
					</div>
					<span
						class="text-sm font-semibold shrink-0
							{tx.type === 'income' ? 'text-success-fg' :
							 tx.type === 'expense' ? 'text-destructive' : 'text-foreground'}"
					>
						{tx.type === 'expense' ? '−' : '+'}{formatAmount(tx.amount, currency)}
					</span>
				</a>
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
