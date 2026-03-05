<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/client/api.svelte';
	import { Building2, Crown, Users, Loader2, ArrowLeft, ExternalLink, Plus, Trash2, Mail } from '@lucide/svelte';
	import { PLANS, PLAN_KEY, ORG_ROLE } from '$lib/configurations/plans';
	import { isAllowedEmailDomain } from '$lib/configurations/auth';
	import * as Accordion from '$lib/components/ui/accordion';
	import { toast } from 'svelte-sonner';

	type Member = {
		id: string;
		userId: string;
		role: string;
		createdAt: string;
		displayName: string | null;
		email: string | null;
		photoURL: string | null;
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

	type SeatInfo = {
		currentMembers: number;
		pendingInvites: number;
		usedSeats: number;
		allowedSeats: number;
		extraSeats: number;
		includedSeats: number;
	};

	type OrgBusiness = {
		id: string;
		name: string;
		memberSummary: Array<{ userId: string; policyKey: string }>;
	};

	type BusinessMember = {
		userId: string;
		businessId: string;
		policyKey: string;
		createdAt: string;
		user: { id: string; email: string; displayName: string | null; photoURL: string | null };
	};

	type BusinessInvitation = {
		id: string;
		email: string;
		policyKey: string;
		status: string;
		expiresAt: string;
	};

	type OrgDetail = {
		id: string;
		name: string;
		role: string;
		planKey: string;
		subscription: Subscription;
		members: Member[];
		businesses: OrgBusiness[];
		businessCount: number;
		seatInfo: SeatInfo | null;
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

	// Checkout state
	let selectedInterval = $state<'month' | 'year'>('year');
	let checkingOut = $state(false);

	// Portal state
	let openingPortal = $state(false);

	// Seat purchase state
	let seatQuantity = $state(1);
	let purchasingSeats = $state(false);

	const plan = $derived(org ? PLANS[org.planKey as keyof typeof PLANS] ?? PLANS[PLAN_KEY.FREE] : PLANS[PLAN_KEY.FREE]);
	const isOwner = $derived(org?.role === ORG_ROLE.OWNER);
	const canInvite = $derived(isOwner && org?.planKey === PLAN_KEY.PRO);
	const seatsFull = $derived(org?.seatInfo ? org.seatInfo.usedSeats >= org.seatInfo.allowedSeats : false);

	const ROLES = ['owner', 'manager', 'cashier', 'viewer'] as const;

	// Per-business member management state
	let accordionValue = $state<string[]>([]);
	let businessMembers = $state<Record<string, BusinessMember[]>>({});
	let businessInvitations = $state<Record<string, BusinessInvitation[]>>({});
	let businessLoading = $state<Record<string, boolean>>({});

	// Invite form state
	let bizInviteOpen = $state<string | null>(null);
	let bizInviteEmail = $state('');
	let bizInviteRole = $state<string>('viewer');
	let bizInviting = $state(false);
	let bizInviteError = $state<string | null>(null);

	// Remove/cancel state
	let removeTarget = $state<{ businessId: string; userId: string; name: string } | null>(null);
	let removing = $state(false);
	let cancelTarget = $state<{ businessId: string; invitationId: string; email: string } | null>(null);
	let cancellingInvite = $state(false);

	// Derived: map userId → business memberships for badges
	const userBusinessMap = $derived.by(() => {
		const map = new Map<string, Array<{ businessName: string; policyKey: string }>>();
		if (!org?.businesses) return map;
		for (const biz of org.businesses) {
			for (const ms of biz.memberSummary) {
				const arr = map.get(ms.userId) ?? [];
				arr.push({ businessName: biz.name, policyKey: ms.policyKey });
				map.set(ms.userId, arr);
			}
		}
		return map;
	});

	function roleColor(role: string) {
		switch (role) {
			case 'owner': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
			case 'manager': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
			case 'cashier': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
			default: return 'bg-muted text-muted-foreground';
		}
	}

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
			const result = await api.post<{ checkoutUrl: string }>(`/organizations/${organizationId}/checkout`, {
				interval: selectedInterval,
			});
			window.location.href = result.checkoutUrl;
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to start checkout');
			checkingOut = false;
		}
	}

	async function handlePortal() {
		try {
			openingPortal = true;
			const result = await api.post<{ portalUrl: string }>(`/organizations/${organizationId}/portal`, {});
			window.open(result.portalUrl, '_blank');
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to open billing portal');
		} finally {
			openingPortal = false;
		}
	}

	async function handlePurchaseSeats() {
		try {
			purchasingSeats = true;
			await api.post(`/organizations/${organizationId}/seats`, { quantity: seatQuantity });
			toast.success('Seats added successfully');
			seatQuantity = 1;
			await loadOrg();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to purchase seats');
		} finally {
			purchasingSeats = false;
		}
	}

	function onAccordionChange(value: string[]) {
		// Load members for newly opened items
		for (const bizId of value) {
			if (!businessMembers[bizId]) {
				loadBusinessMembers(bizId);
			}
		}
	}

	async function loadBusinessMembers(businessId: string) {
		businessLoading = { ...businessLoading, [businessId]: true };
		try {
			const [members, invs] = await Promise.all([
				api.get<BusinessMember[]>(`/businesses/${businessId}/members`),
				canInvite
					? api.get<BusinessInvitation[]>(`/businesses/${businessId}/invitations`)
					: Promise.resolve([] as BusinessInvitation[]),
			]);
			businessMembers = { ...businessMembers, [businessId]: members };
			businessInvitations = { ...businessInvitations, [businessId]: invs };
		} catch {
			// silent
		} finally {
			businessLoading = { ...businessLoading, [businessId]: false };
		}
	}

	async function inviteToBusiness(businessId: string) {
		if (!bizInviteEmail.trim()) return;
		if (!isAllowedEmailDomain(bizInviteEmail.trim())) {
			bizInviteError = 'Only Gmail addresses can be invited at this time';
			return;
		}
		try {
			bizInviting = true;
			bizInviteError = null;
			const email = bizInviteEmail.trim();
			await api.post(`/businesses/${businessId}/invitations`, {
				email: email.toLowerCase(),
				policyKey: bizInviteRole,
			});
			toast.success(`Invitation sent to ${email}`);
			bizInviteEmail = '';
			bizInviteRole = 'viewer';
			bizInviteOpen = null;
			await Promise.all([loadBusinessMembers(businessId), loadOrg()]);
		} catch (e) {
			bizInviteError = e instanceof Error ? e.message : 'Failed to send invitation';
		} finally {
			bizInviting = false;
		}
	}

	async function removeFromBusiness() {
		if (!removeTarget) return;
		const { businessId, userId } = removeTarget;
		try {
			removing = true;
			await api.delete(`/businesses/${businessId}/members/${userId}`);
			toast.success('Member removed');
			removeTarget = null;
			await Promise.all([loadBusinessMembers(businessId), loadOrg()]);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to remove member');
		} finally {
			removing = false;
		}
	}

	async function cancelBusinessInvitation() {
		if (!cancelTarget) return;
		const { businessId, invitationId } = cancelTarget;
		try {
			cancellingInvite = true;
			await api.patch(`/businesses/${businessId}/invitations/${invitationId}/cancel`, {});
			toast.success('Invitation cancelled');
			cancelTarget = null;
			await Promise.all([loadBusinessMembers(businessId), loadOrg()]);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to cancel invitation');
		} finally {
			cancellingInvite = false;
		}
	}

	onMount(() => {
		// Check for checkout success
		const params = new URLSearchParams(window.location.search);
		if (params.get('checkout') === 'success') {
			toast.success('Your Pro subscription is being activated. It may take a moment to reflect.');
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

		<div class="grid gap-4 {isOwner ? 'lg:grid-cols-2' : ''}">
			{#if isOwner}
				<!-- Subscription Info (owner only) -->
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
						{#if org.seatInfo}
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Seats</span>
								<span class="font-medium" class:text-amber-600={org.seatInfo.usedSeats >= org.seatInfo.allowedSeats} class:dark:text-amber-400={org.seatInfo.usedSeats >= org.seatInfo.allowedSeats}>
									{org.seatInfo.usedSeats} / {org.seatInfo.allowedSeats}
									{#if org.seatInfo.extraSeats > 0}
										<span class="text-xs text-muted-foreground">({org.seatInfo.includedSeats} + {org.seatInfo.extraSeats} extra)</span>
									{/if}
								</span>
							</div>
						{/if}
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
					{#if org.planKey === PLAN_KEY.FREE}
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
					{:else if org.planKey === PLAN_KEY.PRO && org.subscription?.stripeCustomerId}
						<div class="mt-4 pt-4 border-t border-border">
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

						<!-- Seat purchase section -->
						{#if org.seatInfo && org.seatInfo.usedSeats >= org.seatInfo.allowedSeats}
							<div class="mt-3 p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
								<p class="text-xs text-amber-700 dark:text-amber-300 mb-3">
									All seats are in use ({org.seatInfo.usedSeats}/{org.seatInfo.allowedSeats}). Purchase additional seats to invite more members.
								</p>
								<div class="flex items-center gap-2">
									<select
										bind:value={seatQuantity}
										class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
									>
										{#each [1, 2, 3, 5, 10] as qty}
											<option value={qty}>{qty} seat{qty > 1 ? 's' : ''}</option>
										{/each}
									</select>
									<button
										onclick={handlePurchaseSeats}
										disabled={purchasingSeats}
										class="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
									>
										{#if purchasingSeats}
											<Loader2 class="size-4 animate-spin" />
										{/if}
										Add — ${seatQuantity * 5}/mo
									</button>
								</div>
							</div>
						{/if}
					{/if}
				</div>
			{/if}

			<!-- Members (owner only) -->
			{#if isOwner}
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
							{@const bizRoles = userBusinessMap.get(member.userId)}
							<div class="flex items-center justify-between py-2 border-b border-border last:border-0">
								<div class="flex items-center gap-2 min-w-0">
									{#if member.photoURL}
										<img src={member.photoURL} alt="" class="size-7 rounded-full shrink-0" />
									{:else}
										<div class="size-7 rounded-full bg-muted flex items-center justify-center shrink-0">
											<span class="text-xs font-medium text-muted-foreground">
												{(member.displayName ?? member.email ?? '?').charAt(0).toUpperCase()}
											</span>
										</div>
									{/if}
									<div class="min-w-0">
										<p class="text-sm text-foreground truncate">{member.displayName ?? member.email ?? member.userId.slice(0, 8)}</p>
										{#if member.displayName && member.email}
											<p class="text-xs text-muted-foreground truncate">{member.email}</p>
										{/if}
										{#if bizRoles?.length}
											<div class="flex flex-wrap gap-1 mt-1">
												{#each bizRoles as bm}
													<span class="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full {roleColor(bm.policyKey)}">
														{bm.businessName} <span class="opacity-60">({bm.policyKey})</span>
													</span>
												{/each}
											</div>
										{/if}
									</div>
								</div>
								<span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize shrink-0">
									{member.role}
								</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
			{/if}
		</div>

		<!-- Businesses (non-owner: simple list) -->
		{#if !isOwner && org.businesses.length > 0}
			<div class="rounded-lg border border-border bg-card p-5 mt-4">
				<h2 class="font-semibold text-foreground mb-4 flex items-center gap-2">
					<Building2 class="size-4" />
					Your Businesses
				</h2>
				<div class="space-y-2">
					{#each org.businesses as biz (biz.id)}
						<a
							href="/businesses/{biz.id}"
							class="flex items-center gap-3 p-3 rounded-md border border-border hover:border-primary/50 hover:bg-accent/50 transition-colors"
						>
							<div class="size-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
								<Building2 class="size-4 text-primary" />
							</div>
							<span class="text-sm font-medium truncate">{biz.name}</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Per-Business Member Management (owner only) -->
		{#if isOwner && org.businesses.length > 0}
			<div class="rounded-lg border border-border bg-card p-5 mt-4">
				<div class="flex items-center justify-between mb-4">
					<h2 class="font-semibold text-foreground flex items-center gap-2">
						<Building2 class="size-4" />
						Business Members
					</h2>
					{#if org.seatInfo}
						<span class="text-xs px-2 py-0.5 rounded-full {seatsFull ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-muted text-muted-foreground'}">
							{org.seatInfo.usedSeats}/{org.seatInfo.allowedSeats} seats
						</span>
					{/if}
				</div>

				<Accordion.Root type="multiple" bind:value={accordionValue} onValueChange={onAccordionChange}>
					{#each org.businesses as biz (biz.id)}
						<Accordion.Item value={biz.id}>
							<Accordion.Trigger class="hover:no-underline">
								<div class="flex items-center gap-2">
									<span class="font-medium text-sm">{biz.name}</span>
									<span class="text-xs text-muted-foreground">
										({biz.memberSummary.length} member{biz.memberSummary.length !== 1 ? 's' : ''})
									</span>
								</div>
							</Accordion.Trigger>
							<Accordion.Content>
								{#if businessLoading[biz.id]}
									<div class="flex justify-center py-6">
										<Loader2 class="size-5 animate-spin text-muted-foreground" />
									</div>
								{:else}
									<!-- Invite button -->
									{#if canInvite}
										<div class="flex justify-end mb-3">
											<button
												onclick={() => { bizInviteOpen = bizInviteOpen === biz.id ? null : biz.id; bizInviteError = null; }}
												disabled={seatsFull}
												class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
											>
												<Plus class="size-4" />
												{seatsFull ? 'Seats Full' : 'Invite Member'}
											</button>
										</div>
									{/if}

									<!-- Inline invite form -->
									{#if bizInviteOpen === biz.id}
										<div class="rounded-lg border border-border bg-card p-4 mb-4">
											<h3 class="text-sm font-semibold mb-3">Invite to {biz.name}</h3>
											{#if bizInviteError}
												<p class="text-destructive text-sm mb-2">{bizInviteError}</p>
											{/if}
											<div class="flex flex-col gap-3">
												<input
													type="email"
													bind:value={bizInviteEmail}
													placeholder="Gmail address"
													class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
												/>
												<select
													bind:value={bizInviteRole}
													class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
												>
													{#each ROLES as r}
														<option value={r}>{r}</option>
													{/each}
												</select>
												<div class="flex justify-end gap-2">
													<button
														onclick={() => { bizInviteOpen = null; bizInviteError = null; }}
														class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
													>
														Cancel
													</button>
													<button
														onclick={() => inviteToBusiness(biz.id)}
														disabled={bizInviting || !bizInviteEmail.trim()}
														class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
													>
														{#if bizInviting}<Loader2 class="size-4 animate-spin" />{/if}
														Send Invite
													</button>
												</div>
											</div>
										</div>
									{/if}

									<!-- Member list -->
									{#each businessMembers[biz.id] ?? [] as member (member.userId)}
										<div class="flex items-center gap-3 py-3 border-b border-border last:border-0">
											{#if member.user.photoURL}
												<img src={member.user.photoURL} alt="" class="size-8 rounded-full shrink-0" />
											{:else}
												<div class="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
													<span class="text-xs font-semibold text-muted-foreground">
														{(member.user.displayName ?? member.user.email ?? '?').charAt(0).toUpperCase()}
													</span>
												</div>
											{/if}
											<div class="flex-1 min-w-0">
												<p class="text-sm font-medium text-foreground truncate">{member.user.displayName ?? member.user.email}</p>
												<p class="text-xs text-muted-foreground truncate">{member.user.email}</p>
											</div>
											<span class="text-xs px-2 py-0.5 rounded-full shrink-0 {roleColor(member.policyKey)} capitalize">
												{member.policyKey}
											</span>
											{#if isOwner && member.policyKey !== 'owner'}
												<button
													onclick={() => (removeTarget = { businessId: biz.id, userId: member.userId, name: member.user.displayName ?? member.user.email })}
													class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
												>
													<Trash2 class="size-3.5" />
												</button>
											{/if}
										</div>
									{/each}

									{#if (businessMembers[biz.id] ?? []).length === 0}
										<p class="text-sm text-muted-foreground py-3">No members in this business.</p>
									{/if}

									<!-- Pending invitations -->
									{#if (businessInvitations[biz.id] ?? []).length > 0}
										<div class="mt-4 pt-3 border-t border-border">
											<h4 class="text-xs font-medium text-muted-foreground mb-2">Pending Invitations</h4>
											{#each businessInvitations[biz.id] ?? [] as inv (inv.id)}
												<div class="flex items-center gap-3 py-2 border-b border-border last:border-0">
													<Mail class="size-4 text-muted-foreground shrink-0" />
													<div class="flex-1 min-w-0">
														<p class="text-sm text-foreground truncate">{inv.email}</p>
														<p class="text-xs text-muted-foreground">Expires {new Date(inv.expiresAt).toLocaleDateString()}</p>
													</div>
													<span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{inv.policyKey}</span>
													{#if isOwner}
														<button
															onclick={() => (cancelTarget = { businessId: biz.id, invitationId: inv.id, email: inv.email })}
															class="text-xs text-muted-foreground hover:text-destructive"
														>
															Cancel
														</button>
													{/if}
												</div>
											{/each}
										</div>
									{/if}
								{/if}
							</Accordion.Content>
						</Accordion.Item>
					{/each}
				</Accordion.Root>
			</div>
		{/if}
	</div>

	<!-- Remove member confirmation modal -->
	{#if isOwner && removeTarget}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onclick={() => (removeTarget = null)} role="presentation">
			<div class="bg-card border border-border rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg" onclick={(e) => e.stopPropagation()} role="dialog">
				<h3 class="font-semibold text-foreground mb-2">Remove Member</h3>
				<p class="text-sm text-muted-foreground mb-4">
					Are you sure you want to remove <span class="font-medium text-foreground">{removeTarget.name}</span> from this business?
				</p>
				<div class="flex justify-end gap-2">
					<button
						onclick={() => (removeTarget = null)}
						class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
					>
						Cancel
					</button>
					<button
						onclick={removeFromBusiness}
						disabled={removing}
						class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50"
					>
						{#if removing}<Loader2 class="size-4 animate-spin" />{/if}
						Remove
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Cancel invitation confirmation modal -->
	{#if isOwner && cancelTarget}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onclick={() => (cancelTarget = null)} role="presentation">
			<div class="bg-card border border-border rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg" onclick={(e) => e.stopPropagation()} role="dialog">
				<h3 class="font-semibold text-foreground mb-2">Cancel Invitation</h3>
				<p class="text-sm text-muted-foreground mb-4">
					Cancel the pending invitation for <span class="font-medium text-foreground">{cancelTarget.email}</span>?
				</p>
				<div class="flex justify-end gap-2">
					<button
						onclick={() => (cancelTarget = null)}
						class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
					>
						Keep
					</button>
					<button
						onclick={cancelBusinessInvitation}
						disabled={cancellingInvite}
						class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50"
					>
						{#if cancellingInvite}<Loader2 class="size-4 animate-spin" />{/if}
						Cancel Invitation
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
