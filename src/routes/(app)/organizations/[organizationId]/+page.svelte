<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/client/api.svelte';
	import { Building2, Crown, Users, Loader2, ArrowLeft, ExternalLink, Check } from '@lucide/svelte';
	import { PLANS, PLAN_KEY, ORG_ROLE } from '$lib/configurations/plans';

	type Member = {
		id: string;
		userId: string;
		role: string;
		createdAt: string;
	};

	type Subscription = {
		id: string;
		planKey: string;
		status: string;
		currentPeriodStart: string | null;
		currentPeriodEnd: string | null;
		cancelAtPeriodEnd: boolean;
		stripeCustomerId: string | null;
	} | null;

	type OrgDetail = {
		id: string;
		name: string;
		role: string;
		planKey: string;
		subscription: Subscription;
		members: Member[];
		businessCount: number;
		createdAt: string;
		updatedAt: string;
	};

	const organizationId = $derived($page.params.organizationId);

	let org = $state<OrgDetail | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Edit state
	let editName = $state('');
	let saving = $state(false);
	let saveSuccess = $state(false);
	let saveError = $state<string | null>(null);

	// Checkout state
	let selectedInterval = $state<'month' | 'year'>('year');
	let checkingOut = $state(false);
	let checkoutError = $state<string | null>(null);
	let checkoutSuccess = $state(false);

	// Portal state
	let openingPortal = $state(false);
	let portalError = $state<string | null>(null);

	const plan = $derived(org ? PLANS[org.planKey as keyof typeof PLANS] ?? PLANS[PLAN_KEY.FREE] : PLANS[PLAN_KEY.FREE]);
	const isOwner = $derived(org?.role === ORG_ROLE.OWNER);

	async function loadOrg() {
		try {
			loading = true;
			error = null;
			org = await api.get<OrgDetail>(`/organizations/${organizationId}`);
			editName = org.name;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load organization';
		} finally {
			loading = false;
		}
	}

	function planLabel(planKey: string): string {
		return planKey === PLAN_KEY.PRO ? 'Pro' : 'Free';
	}

	function planClass(planKey: string): string {
		return planKey === PLAN_KEY.PRO
			? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
			: 'bg-muted text-muted-foreground';
	}

	async function handleCheckout() {
		try {
			checkingOut = true;
			checkoutError = null;
			const result = await api.post<{ checkoutUrl: string }>(`/organizations/${organizationId}/checkout`, {
				interval: selectedInterval,
			});
			window.location.href = result.checkoutUrl;
		} catch (e) {
			checkoutError = e instanceof Error ? e.message : 'Failed to start checkout';
			checkingOut = false;
		}
	}

	async function handlePortal() {
		try {
			openingPortal = true;
			portalError = null;
			const result = await api.post<{ portalUrl: string }>(`/organizations/${organizationId}/portal`, {});
			window.open(result.portalUrl, '_blank');
		} catch (e) {
			portalError = e instanceof Error ? e.message : 'Failed to open billing portal';
		} finally {
			openingPortal = false;
		}
	}

	onMount(() => {
		// Check for checkout success
		const params = new URLSearchParams(window.location.search);
		if (params.get('checkout') === 'success') {
			checkoutSuccess = true;
			// Clean up URL
			const url = new URL(window.location.href);
			url.searchParams.delete('checkout');
			window.history.replaceState({}, '', url.toString());
		}
		loadOrg();
	});
</script>

{#if loading}
	<div class="flex items-center justify-center py-20">
		<Loader2 class="size-8 animate-spin text-muted-foreground" />
	</div>
{:else if error}
	<div class="text-center py-20">
		<p class="text-destructive mb-3">{error}</p>
		<button onclick={loadOrg} class="text-sm text-primary hover:underline">Retry</button>
	</div>
{:else if org}
	<div class="p-4 md:p-6 max-w-4xl mx-auto">
		<!-- Checkout success banner -->
		{#if checkoutSuccess}
			<div class="mb-4 p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2">
				<Check class="size-4 text-green-600 dark:text-green-400 shrink-0" />
				<p class="text-sm text-green-700 dark:text-green-300">
					Your Pro subscription is being activated. It may take a moment to reflect.
				</p>
			</div>
		{/if}

		<!-- Header -->
		<div class="mb-6">
			<a href="/organizations" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
				<ArrowLeft class="size-3.5" />
				Back to organizations
			</a>
			<div class="flex items-center gap-3">
				<div class="size-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
					<Building2 class="size-6 text-primary" />
				</div>
				<div>
					<h1 class="text-2xl font-bold text-foreground">{org.name}</h1>
					<div class="flex items-center gap-2 mt-1">
						<span class="text-xs px-2 py-0.5 rounded-full {planClass(org.planKey)} inline-flex items-center gap-1">
							{#if org.planKey === PLAN_KEY.PRO}<Crown class="size-3" />{/if}
							{planLabel(org.planKey)}
						</span>
						<span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{org.role}</span>
					</div>
				</div>
			</div>
		</div>

		<div class="grid gap-4 lg:grid-cols-2">
			<!-- Subscription Info -->
			<div class="rounded-lg border border-border bg-card p-5">
				<h2 class="font-semibold text-foreground mb-4 flex items-center gap-2">
					<Crown class="size-4" />
					Subscription
				</h2>
				<div class="space-y-3">
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Current plan</span>
						<span class="font-medium">{plan.name}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Businesses</span>
						<span class="font-medium">
							{org.businessCount} / {plan.limits.maxBusinesses === -1 ? 'Unlimited' : plan.limits.maxBusinesses}
						</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Max attachment size</span>
						<span class="font-medium">
							{plan.limits.maxAttachmentSizeMb === 0 ? 'Not available' : `${plan.limits.maxAttachmentSizeMb} MB`}
						</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">File attachments</span>
						<span class="font-medium {plan.features.includes('attachment:upload') ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}">
							{plan.features.includes('attachment:upload') ? 'Enabled' : 'Disabled'}
						</span>
					</div>
					{#if org.subscription}
						<div class="flex justify-between text-sm">
							<span class="text-muted-foreground">Status</span>
							<span class="font-medium capitalize">{org.subscription.status}</span>
						</div>
						{#if org.subscription.currentPeriodEnd}
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Period ends</span>
								<span class="font-medium">{new Date(org.subscription.currentPeriodEnd).toLocaleDateString()}</span>
							</div>
						{/if}
					{/if}
				</div>

				<!-- Cancel at period end warning -->
				{#if org.subscription?.cancelAtPeriodEnd && org.subscription.currentPeriodEnd}
					<div class="mt-4 p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
						<p class="text-xs text-amber-700 dark:text-amber-300">
							Your Pro plan will end on {new Date(org.subscription.currentPeriodEnd).toLocaleDateString()}. You'll be downgraded to Free after that.
						</p>
					</div>
				{/if}

				<!-- Upgrade section (Free plan + owner) -->
				{#if org.planKey === PLAN_KEY.FREE && isOwner}
					<div class="mt-4 pt-4 border-t border-border">
						<p class="text-xs text-muted-foreground mb-3">
							Upgrade to Pro to unlock file attachments, email documents, CSV export, team invitations, and up to 5 businesses.
						</p>

						<!-- Interval toggle -->
						<div class="flex rounded-md border border-border overflow-hidden mb-3">
							<button
								onclick={() => (selectedInterval = 'month')}
								class="flex-1 px-3 py-2 text-xs font-medium transition-colors {selectedInterval === 'month' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}"
							>
								Monthly — $12/mo
							</button>
							<button
								onclick={() => (selectedInterval = 'year')}
								class="flex-1 px-3 py-2 text-xs font-medium transition-colors {selectedInterval === 'year' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}"
							>
								Yearly — $120/yr
								<span class="text-[10px] opacity-75 ml-1">save $24</span>
							</button>
						</div>

						{#if checkoutError}
							<p class="text-xs text-destructive mb-2">{checkoutError}</p>
						{/if}

						<button
							onclick={handleCheckout}
							disabled={checkingOut}
							class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
						>
							{#if checkingOut}
								<Loader2 class="size-4 animate-spin" />
								Redirecting to checkout…
							{:else}
								Upgrade to Pro
							{/if}
						</button>
					</div>

				<!-- Manage section (Pro plan + owner) -->
				{:else if org.planKey === PLAN_KEY.PRO && isOwner && org.subscription?.stripeCustomerId}
					<div class="mt-4 pt-4 border-t border-border">
						{#if portalError}
							<p class="text-xs text-destructive mb-2">{portalError}</p>
						{/if}
						<button
							onclick={handlePortal}
							disabled={openingPortal}
							class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border bg-background text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
						>
							{#if openingPortal}
								<Loader2 class="size-4 animate-spin" />
							{:else}
								<ExternalLink class="size-3.5" />
							{/if}
							Manage Subscription
						</button>
					</div>
				{/if}
			</div>

			<!-- Members -->
			<div class="rounded-lg border border-border bg-card p-5">
				<h2 class="font-semibold text-foreground mb-4 flex items-center gap-2">
					<Users class="size-4" />
					Members ({org.members.length})
				</h2>
				{#if org.members.length === 0}
					<p class="text-sm text-muted-foreground">No members</p>
				{:else}
					<div class="space-y-2">
						{#each org.members as member (member.id)}
							<div class="flex items-center justify-between py-2 border-b border-border last:border-0">
								<span class="text-sm text-foreground font-mono">{member.userId.slice(0, 8)}…</span>
								<span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
									{member.role}
								</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
