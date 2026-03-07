<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/client/api.svelte';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Building2, Plus, X, Loader2, Crown, Mail } from '@lucide/svelte';
	import CurrencyCombobox from '$lib/components/CurrencyCombobox.svelte';
	import PhoneCodeCombobox from '$lib/components/PhoneCodeCombobox.svelte';
	import AddressInput from '$lib/components/AddressInput.svelte';
	import { PLAN_KEY, PLANS } from '$lib/configurations/plans';

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

	const currentPlanKey = $derived(
		($page.data.navBusinesses as { planKey: string }[])?.some((b) => b.planKey === PLAN_KEY.PRO)
			? PLAN_KEY.PRO
			: PLAN_KEY.FREE
	);
	const plan = $derived(PLANS[currentPlanKey as keyof typeof PLANS]);
	const canCreateBusiness = $derived(
		plan.limits.maxBusinesses === -1 || businesses.length < plan.limits.maxBusinesses
	);

	// Create form state
	let createName        = $state('');
	let createDescription = $state('');
	let createCurrency    = $state('USD');
	let createAddrLine1      = $state('');
	let createAddrLine2      = $state('');
	let createAddrCity       = $state('');
	let createAddrState      = $state('');
	let createAddrPostalCode = $state('');
	let createAddrCountry    = $state('');
	let createPhoneCode   = $state('+1');
	let createPhoneNumber = $state('');
	let createTaxId       = $state('');
	let creating          = $state(false);

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
			const created = await api.post<Business>('/businesses', {
				name:        createName.trim(),
				description: createDescription.trim() || undefined,
				currency:    createCurrency,
				addressLine1:      createAddrLine1.trim() || undefined,
				addressLine2:      createAddrLine2.trim() || undefined,
				addressCity:       createAddrCity.trim() || undefined,
				addressState:      createAddrState.trim() || undefined,
				addressPostalCode: createAddrPostalCode.trim() || undefined,
				addressCountry:    createAddrCountry.trim() || undefined,
				phone:       createPhoneNumber.trim() ? `${createPhoneCode}${createPhoneNumber.trim()}` : undefined,
				taxId:       createTaxId.trim() || undefined,
			});
			businesses = [created, ...businesses];
			showCreate = false;
			createName        = '';
			createDescription = '';
			createCurrency    = 'USD';
			createAddrLine1      = '';
			createAddrLine2      = '';
			createAddrCity       = '';
			createAddrState      = '';
			createAddrPostalCode = '';
			createAddrCountry    = '';
			createPhoneCode   = '+1';
			createPhoneNumber = '';
			createTaxId       = '';
			toast.success('Business created');
			invalidateAll();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to create business');
		} finally {
			creating = false;
		}
	}

	onMount(loadBusinesses);
</script>

<div class="p-4 md:p-6 max-w-4xl mx-auto">
	<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-foreground">My Businesses</h1>
			<p class="text-sm text-muted-foreground mt-0.5">Manage your business entities</p>
		</div>
		{#if canCreateBusiness}
			<button
				onclick={() => (showCreate = !showCreate)}
				class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors self-start sm:self-auto"
			>
				<Plus class="size-3.5" />
				New Business
			</button>
		{:else}
			<span class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium self-start sm:self-auto">
				<Crown class="size-4" />
				{plan.limits.maxBusinesses}/{plan.limits.maxBusinesses} businesses
			</span>
		{/if}
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

			<div class="flex flex-col gap-3">

				<!-- Required -->
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

				<!-- Optional -->
				<div>
					<label class="text-sm font-medium text-foreground block mb-1" for="create-desc">
						Description
					</label>
					<textarea
						id="create-desc"
						bind:value={createDescription}
						rows="2"
						placeholder="Optional"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
					></textarea>
				</div>

				<div>
					<label class="text-sm font-medium text-foreground block mb-1">
						Currency
					</label>
					<CurrencyCombobox bind:value={createCurrency} />
				</div>

				<div>
					<label class="text-sm font-medium text-foreground block mb-1">
						Address
					</label>
					<AddressInput bind:line1={createAddrLine1} bind:line2={createAddrLine2} bind:city={createAddrCity} bind:region={createAddrState} bind:postalCode={createAddrPostalCode} bind:country={createAddrCountry} />
				</div>

				<div>
					<label class="text-sm font-medium text-foreground block mb-1" for="create-phone-number">
						Phone
					</label>
					<div class="flex rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring overflow-hidden">
						<PhoneCodeCombobox bind:value={createPhoneCode} />
						<input
							id="create-phone-number"
							type="tel"
							bind:value={createPhoneNumber}
							placeholder="Optional"
							class="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
						/>
					</div>
				</div>

				<div>
					<label class="text-sm font-medium text-foreground block mb-1" for="create-taxid">
						Tax ID / SST No.
					</label>
					<input
						id="create-taxid"
						type="text"
						bind:value={createTaxId}
						placeholder="Optional"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
					/>
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
			{#if ($page.data.pendingInvitationCount ?? 0) > 0}
				<a
					href="/invitations"
					class="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 mb-3"
				>
					<Mail class="size-4" />
					View {$page.data.pendingInvitationCount} pending invitation{$page.data.pendingInvitationCount === 1 ? '' : 's'}
				</a>
				<p class="text-xs text-muted-foreground mb-4">or</p>
			{/if}
			<button
				onclick={() => (showCreate = true)}
				class="px-4 py-2 rounded-md {($page.data.pendingInvitationCount ?? 0) > 0 ? 'border border-border text-foreground hover:bg-accent' : 'bg-primary text-primary-foreground hover:bg-primary/90'} text-sm font-medium"
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
