<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/client/api.svelte';
	import { Building2, Plus, X, Loader2 } from '@lucide/svelte';

	type Business = {
		id: string;
		name: string;
		description: string | null;
		currency: string;
		policyKey: string;
		createdAt: string;
	};

	let businesses = $state<Business[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let showCreate = $state(false);

	// Create form state
	let createName = $state('');
	let createDescription = $state('');
	let createCurrency = $state('MYR');
	let creating = $state(false);
	let createError = $state<string | null>(null);

	async function loadBusinesses() {
		try {
			loading = true;
			error = null;
			businesses = await api.get<Business[]>('/businesses');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load businesses';
		} finally {
			loading = false;
		}
	}

	async function createBusiness() {
		if (!createName.trim()) return;
		try {
			creating = true;
			createError = null;
			const created = await api.post<Business>('/businesses', {
				name: createName.trim(),
				description: createDescription.trim() || undefined,
				currency: createCurrency
			});
			businesses = [created, ...businesses];
			showCreate = false;
			createName = '';
			createDescription = '';
			createCurrency = 'MYR';
		} catch (e) {
			createError = e instanceof Error ? e.message : 'Failed to create business';
		} finally {
			creating = false;
		}
	}

	onMount(loadBusinesses);
</script>

<div class="p-4 md:p-6 max-w-4xl mx-auto">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-foreground">My Businesses</h1>
			<p class="text-sm text-muted-foreground mt-0.5">Manage your business entities</p>
		</div>
		<button
			onclick={() => (showCreate = !showCreate)}
			class="flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
		>
			<Plus class="size-4" />
			New Business
		</button>
	</div>

	<!-- Create form -->
	{#if showCreate}
		<div class="mb-6 p-5 rounded-lg border border-border bg-card shadow-sm">
			<div class="flex items-center justify-between mb-4">
				<h2 class="font-semibold">Create Business</h2>
				<button onclick={() => (showCreate = false)} class="text-muted-foreground hover:text-foreground">
					<X class="size-4" />
				</button>
			</div>

			{#if createError}
				<p class="text-sm text-destructive mb-3">{createError}</p>
			{/if}

			<div class="flex flex-col gap-3">
				<div>
					<label class="text-sm font-medium text-foreground block mb-1" for="create-name">
						Name <span class="text-destructive">*</span>
					</label>
					<input
						id="create-name"
						type="text"
						bind:value={createName}
						placeholder="e.g. My Cafe"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>
				<div>
					<label class="text-sm font-medium text-foreground block mb-1" for="create-desc">
						Description
					</label>
					<textarea
						id="create-desc"
						bind:value={createDescription}
						rows="2"
						placeholder="Optional description"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
					></textarea>
				</div>
				<div>
					<label class="text-sm font-medium text-foreground block mb-1" for="create-currency">
						Currency
					</label>
					<select
						id="create-currency"
						bind:value={createCurrency}
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					>
						<option value="MYR">MYR – Malaysian Ringgit</option>
						<option value="USD">USD – US Dollar</option>
						<option value="SGD">SGD – Singapore Dollar</option>
						<option value="IDR">IDR – Indonesian Rupiah</option>
					</select>
				</div>
				<div class="flex justify-end gap-2 pt-1">
					<button
						onclick={() => (showCreate = false)}
						class="px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted"
					>
						Cancel
					</button>
					<button
						onclick={createBusiness}
						disabled={creating || !createName.trim()}
						class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
					>
						{#if creating}<Loader2 class="size-4 animate-spin" />{/if}
						Create
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Loading -->
	{#if loading}
		<div class="flex items-center justify-center py-20">
			<Loader2 class="size-8 animate-spin text-muted-foreground" />
		</div>

	<!-- Error -->
	{:else if error}
		<div class="text-center py-20">
			<p class="text-destructive mb-3">{error}</p>
			<button onclick={loadBusinesses} class="text-sm text-primary hover:underline">Retry</button>
		</div>

	<!-- Empty -->
	{:else if businesses.length === 0}
		<div class="text-center py-20">
			<Building2 class="size-12 text-muted-foreground mx-auto mb-4" />
			<h3 class="text-lg font-semibold mb-1">No businesses yet</h3>
			<p class="text-sm text-muted-foreground mb-4">Create your first business to get started.</p>
			<button
				onclick={() => (showCreate = true)}
				class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
			>
				Create Business
			</button>
		</div>

	<!-- List -->
	{:else}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each businesses as biz (biz.id)}
				<a
					href="/businesses/{biz.id}"
					class="block rounded-lg border border-border bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all group"
				>
					<div class="flex items-start gap-3">
						<div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<Building2 class="size-5 text-primary" />
						</div>
						<div class="min-w-0 flex-1">
							<h3 class="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
								{biz.name}
							</h3>
							{#if biz.description}
								<p class="text-xs text-muted-foreground mt-0.5 line-clamp-2">{biz.description}</p>
							{/if}
						</div>
					</div>
					<div class="mt-3 flex items-center gap-2">
						<span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
							{biz.currency}
						</span>
						<span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
							{biz.policyKey}
						</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
