<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/client/api.svelte';
	import { Building2, Crown, Users, Loader2, ArrowLeft, Save } from '@lucide/svelte';
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

	onMount(loadOrg);
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

				{#if org.planKey === PLAN_KEY.FREE && isOwner}
					<div class="mt-4 pt-4 border-t border-border">
						<p class="text-xs text-muted-foreground mb-2">
							Upgrade to Pro to unlock file attachments and more businesses.
						</p>
						<button
							disabled
							class="w-full px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium opacity-50 cursor-not-allowed"
						>
							Upgrade to Pro (Coming soon)
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
