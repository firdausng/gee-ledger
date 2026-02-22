<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api, parseToCents } from '$lib/client/api.svelte';
	import { ArrowLeft, Loader2 } from '@lucide/svelte';

	type Location = { id: string; name: string; type: string };
	type Channel = { id: string; name: string; type: string };
	type Category = { id: string; name: string; type: string };

	const businessId = $page.params.businessId;

	let locations = $state<Location[]>([]);
	let channels = $state<Channel[]>([]);
	let categories = $state<Category[]>([]);
	let loadingMeta = $state(true);

	// Form fields
	let type = $state<'income' | 'expense' | 'transfer'>('income');
	let transactionDate = $state(new Date().toISOString().slice(0, 10));
	let amountRaw = $state('');
	let locationId = $state('');
	let salesChannelId = $state('');
	let categoryId = $state('');
	let note = $state('');
	let referenceNo = $state('');

	let submitting = $state(false);
	let submitError = $state<string | null>(null);

	let filteredCategories = $derived(categories.filter((c) => c.type === type || type === 'transfer'));

	async function loadMeta() {
		try {
			const [locs, chans, cats] = await Promise.all([
				api.get<Location[]>(`/businesses/${businessId}/locations`),
				api.get<Channel[]>(`/businesses/${businessId}/channels`),
				api.get<Category[]>(`/businesses/${businessId}/categories`)
			]);
			locations = locs;
			channels = chans;
			categories = cats;
			if (locs.length > 0) locationId = locs[0].id;
		} catch {
			// non-critical
		} finally {
			loadingMeta = false;
		}
	}

	async function submit() {
		if (!locationId || !amountRaw || !transactionDate) return;
		if (type === 'income' && !salesChannelId) {
			submitError = 'Sales channel is required for income transactions.';
			return;
		}

		try {
			submitting = true;
			submitError = null;
			await api.post(`/businesses/${businessId}/transactions`, {
				type,
				transactionDate,
				amount: parseToCents(amountRaw),
				locationId,
				salesChannelId: salesChannelId || undefined,
				categoryId: categoryId || undefined,
				note: note.trim() || undefined,
				referenceNo: referenceNo.trim() || undefined
			});
			goto(`/businesses/${businessId}/transactions`);
		} catch (e) {
			submitError = e instanceof Error ? e.message : 'Failed to create transaction';
		} finally {
			submitting = false;
		}
	}

	onMount(loadMeta);
</script>

<div class="max-w-lg">
	<a
		href="/businesses/{businessId}/transactions"
		class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
	>
		<ArrowLeft class="size-3.5" />
		Back to Transactions
	</a>

	<h2 class="text-lg font-semibold text-foreground mb-5">New Transaction</h2>

	{#if submitError}
		<div class="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{submitError}</div>
	{/if}

	<div class="flex flex-col gap-4">
		<!-- Type -->
		<div>
			<label class="text-sm font-medium block mb-1">Type <span class="text-destructive">*</span></label>
			<div class="flex gap-2">
				{#each ['income', 'expense', 'transfer'] as t}
					<button
						type="button"
						onclick={() => { type = t as typeof type; salesChannelId = ''; categoryId = ''; }}
						class="flex-1 py-2 rounded-md border text-sm font-medium capitalize transition-colors
							{type === t ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground hover:border-muted-foreground'}"
					>
						{t}
					</button>
				{/each}
			</div>
		</div>

		<!-- Date -->
		<div>
			<label class="text-sm font-medium block mb-1" for="tx-date">
				Date <span class="text-destructive">*</span>
			</label>
			<input
				id="tx-date"
				type="date"
				bind:value={transactionDate}
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			/>
		</div>

		<!-- Amount -->
		<div>
			<label class="text-sm font-medium block mb-1" for="tx-amount">
				Amount <span class="text-destructive">*</span>
			</label>
			<input
				id="tx-amount"
				type="number"
				step="0.01"
				min="0.01"
				bind:value={amountRaw}
				placeholder="0.00"
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			/>
		</div>

		<!-- Location -->
		<div>
			<label class="text-sm font-medium block mb-1" for="tx-location">
				Location <span class="text-destructive">*</span>
			</label>
			{#if loadingMeta}
				<div class="h-10 rounded-md border border-input bg-muted animate-pulse"></div>
			{:else}
				<select
					id="tx-location"
					bind:value={locationId}
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				>
					<option value="">Select location</option>
					{#each locations as loc (loc.id)}
						<option value={loc.id}>{loc.name}</option>
					{/each}
				</select>
			{/if}
		</div>

		<!-- Sales Channel (required for income) -->
		{#if type !== 'transfer'}
			<div>
				<label class="text-sm font-medium block mb-1" for="tx-channel">
					Sales Channel {type === 'income' ? '<span class="text-destructive">*</span>' : ''}
				</label>
				<select
					id="tx-channel"
					bind:value={salesChannelId}
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				>
					<option value="">Select channel</option>
					{#each channels as ch (ch.id)}
						<option value={ch.id}>{ch.name}</option>
					{/each}
				</select>
			</div>
		{/if}

		<!-- Category -->
		<div>
			<label class="text-sm font-medium block mb-1" for="tx-category">Category</label>
			<select
				id="tx-category"
				bind:value={categoryId}
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			>
				<option value="">No category</option>
				{#each filteredCategories as cat (cat.id)}
					<option value={cat.id}>{cat.name}</option>
				{/each}
			</select>
		</div>

		<!-- Note -->
		<div>
			<label class="text-sm font-medium block mb-1" for="tx-note">Note</label>
			<input
				id="tx-note"
				type="text"
				bind:value={note}
				placeholder="Optional note"
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			/>
		</div>

		<!-- Reference No -->
		<div>
			<label class="text-sm font-medium block mb-1" for="tx-ref">Reference No.</label>
			<input
				id="tx-ref"
				type="text"
				bind:value={referenceNo}
				placeholder="Optional reference number"
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			/>
		</div>

		<!-- Actions -->
		<div class="flex justify-end gap-2 pt-2">
			<a
				href="/businesses/{businessId}/transactions"
				class="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted"
			>
				Cancel
			</a>
			<button
				onclick={submit}
				disabled={submitting || !locationId || !amountRaw || !transactionDate}
				class="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
			>
				{#if submitting}<Loader2 class="size-4 animate-spin" />{/if}
				Save Transaction
			</button>
		</div>
	</div>
</div>
