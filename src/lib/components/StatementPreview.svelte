<script lang="ts">
	type Transaction = {
		id: string;
		type: string;
		amount: number;
		transactionDate: string;
		note?: string | null;
		referenceNo?: string | null;
	};

	type Props = {
		business: {
			name: string;
			currency: string;
			address?: string | null;
			phone?: string | null;
			taxId?: string | null;
			logoR2Key?: string | null;
		};
		businessId: string;
		transactions: Transaction[];
		from: string;
		to: string;
		title?: string;
		referenceNo?: string;
		locationName?: string;
		billTo?: { name?: string; address?: string };
		showBalance?: boolean;
		compact?: boolean;
	};

	let {
		business: biz,
		businessId,
		transactions,
		from,
		to,
		title = 'Statement',
		referenceNo,
		locationName,
		billTo,
		showBalance = false,
		compact = false,
	}: Props = $props();

	function fmt(cents: number): string {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: biz.currency }).format(cents / 100);
	}

	function fmtDate(d: string): string {
		return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
			year: 'numeric', month: 'short', day: 'numeric'
		});
	}

	const rows = $derived((() => {
		let balance = 0;
		return transactions.map((t) => {
			if (t.type === 'income') {
				balance += t.amount;
			} else {
				balance -= t.amount;
			}
			return { ...t, runningBalance: balance };
		});
	})());

	const totalCredits = $derived(
		transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
	);
	const totalDebits = $derived(
		transactions.filter((t) => t.type !== 'income').reduce((s, t) => s + t.amount, 0)
	);
	const netBalance = $derived(totalCredits - totalDebits);
	const hasBillTo = $derived(!!(billTo?.name || billTo?.address));
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

	<!-- Statement title -->
	<p class="{compact ? 'text-xl' : 'text-3xl'} font-bold tracking-wide text-gray-900 mb-5">
		{title.toUpperCase()}
	</p>

	<!-- Two-column: statement meta (left) + Bill To (right) -->
	<div class="grid {hasBillTo ? 'grid-cols-2' : 'grid-cols-1'} gap-6 mb-6 {compact ? 'text-xs' : 'text-sm'}">
		<div class="flex flex-col gap-1 text-gray-600">
			{#if referenceNo}
				<div class="flex gap-2">
					<span class="text-gray-400 w-24 shrink-0">Reference</span>
					<span class="font-semibold">{referenceNo}</span>
				</div>
			{/if}
			<div class="flex gap-2">
				<span class="text-gray-400 w-24 shrink-0">Period</span>
				<span>{fmtDate(from)} — {fmtDate(to)}</span>
			</div>
			{#if locationName}
				<div class="flex gap-2">
					<span class="text-gray-400 w-24 shrink-0">Location</span>
					<span>{locationName}</span>
				</div>
			{/if}
			<div class="flex gap-2">
				<span class="text-gray-400 w-24 shrink-0">Currency</span>
				<span>{biz.currency}</span>
			</div>
		</div>

		{#if hasBillTo}
			<div>
				<p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Prepared For</p>
				{#if billTo?.name}
					<p class="font-semibold text-gray-900">{billTo.name}</p>
				{/if}
				{#if billTo?.address}
					<p class="text-gray-500 whitespace-pre-line mt-0.5">{billTo.address}</p>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Transactions table -->
	{#if transactions.length === 0}
		<div class="border border-gray-200 rounded-lg py-10 text-center {compact ? 'text-xs' : 'text-sm'} text-gray-400">
			No transactions in this period
		</div>
	{:else}
		<div class="border border-gray-200 rounded-lg overflow-hidden {compact ? 'text-xs' : 'text-sm'} mb-6">
			<table class="w-full">
				<thead>
					<tr class="bg-gray-50 border-b border-gray-200">
						<th class="text-left px-3 py-2.5 font-semibold text-gray-600 w-24">Date</th>
						<th class="text-left px-3 py-2.5 font-semibold text-gray-600">Description</th>
						<th class="text-right px-3 py-2.5 font-semibold text-gray-600 w-28">Debit</th>
						<th class="text-right px-3 py-2.5 font-semibold text-gray-600 w-28">Credit</th>
						{#if showBalance}<th class="text-right px-3 py-2.5 font-semibold text-gray-600 w-28">Balance</th>{/if}
					</tr>
				</thead>
				<tbody>
					{#each rows as row, i (row.id)}
						<tr class="border-b border-gray-100 last:border-0 {i % 2 === 1 ? 'bg-gray-50/50' : ''}">
							<td class="px-3 py-2.5 text-gray-500 font-mono whitespace-nowrap">{row.transactionDate}</td>
							<td class="px-3 py-2.5 text-gray-800">
								<span class="block">{row.note ?? '—'}</span>
								{#if row.referenceNo}
									<span class="text-gray-400 {compact ? 'text-xs' : 'text-xs'}">Ref: {row.referenceNo}</span>
								{/if}
							</td>
							<td class="px-3 py-2.5 text-right font-mono text-gray-700">
								{#if row.type !== 'income'}{fmt(row.amount)}{/if}
							</td>
							<td class="px-3 py-2.5 text-right font-mono text-gray-700">
								{#if row.type === 'income'}{fmt(row.amount)}{/if}
							</td>
							{#if showBalance}
							<td class="px-3 py-2.5 text-right font-mono font-medium {row.runningBalance < 0 ? 'text-red-600' : 'text-gray-900'}">
								{fmt(row.runningBalance)}
							</td>
						{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<!-- Summary -->
	<div class="flex justify-end mb-6">
		<div class="border border-gray-200 rounded-lg overflow-hidden {compact ? 'text-xs w-56' : 'text-sm w-72'}">
			<div class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
				<span class="text-gray-500">Total Credits (Income)</span>
				<span class="font-mono text-gray-800">{fmt(totalCredits)}</span>
			</div>
			<div class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
				<span class="text-gray-500">Total Debits (Expense)</span>
				<span class="font-mono text-gray-800">{fmt(totalDebits)}</span>
			</div>
			<div class="flex items-center justify-between px-4 py-2.5 bg-gray-50">
				<span class="font-semibold text-gray-700">Net Balance</span>
				<span class="font-mono font-bold {netBalance < 0 ? 'text-red-600' : 'text-gray-900'}">{fmt(netBalance)}</span>
			</div>
		</div>
	</div>

	<!-- Footer -->
	<div class="border-t border-gray-100 pt-3 text-center text-xs text-gray-400">
		Gee Ledger · ledger.nurzerani.com
	</div>
</div>
