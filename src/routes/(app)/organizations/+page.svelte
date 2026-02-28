<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/client/api.svelte';
	import { Building2, Plus, X, Loader2, Crown } from '@lucide/svelte';
	import { PLAN_KEY } from '$lib/configurations/plans';

	type Organization = {
		id: string;
		name: string;
		role: string;
		planKey: string;
		createdAt: string;
	};

	let orgs = $state<Organization[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let showCreate = $state(false);

	// Create form
	let createName = $state('');
	let creating = $state(false);
	let createError = $state<string | null>(null);

	async function loadOrgs() {
		try {
			loading = true;
			error = null;
			orgs = await api.get<Organization[]>('/organizations');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load organizations';
		} finally {
			loading = false;
		}
	}

	async function createOrg() {
		if (!createName.trim()) return;
		try {
			creating = true;
			createError = null;
			const created = await api.post<Organization>('/organizations', {
				name: createName.trim(),
			});
			orgs = [created, ...orgs];
			showCreate = false;
			createName = '';
		} catch (e) {
			createError = e instanceof Error ? e.message : 'Failed to create organization';
		} finally {
			creating = false;
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

	onMount(loadOrgs);
</script>

<div class="p-4 md:p-6 max-w-4xl mx-auto">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-foreground">Organizations</h1>
			<p class="text-sm text-muted-foreground mt-0.5">Manage your organizations and subscriptions</p>
		</div>
		<button
			onclick={() => (showCreate = !showCreate)}
			class="flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
		>
			<Plus class="size-4" />
			New Organization
		</button>
	</div>

	<!-- Create form -->
	{#if showCreate}
		<div class="mb-6 p-5 rounded-lg border border-border bg-card shadow-sm">
			<div class="flex items-center justify-between mb-4">
				<h2 class="font-semibold">Create Organization</h2>
				<button onclick={() => (showCreate = false)} class="text-muted-foreground hover:text-foreground">
					<X class="size-4" />
				</button>
			</div>

			{#if createError}
				<p class="text-sm text-destructive mb-3">{createError}</p>
			{/if}

			<div class="flex flex-col gap-3">
				<div>
					<label class="text-sm font-medium text-foreground block mb-1" for="create-org-name">
						Name <span class="text-destructive">*</span>
					</label>
					<input
						id="create-org-name"
						type="text"
						bind:value={createName}
						placeholder="e.g. My Company"
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
						onclick={createOrg}
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
			<button onclick={loadOrgs} class="text-sm text-primary hover:underline">Retry</button>
		</div>

	<!-- Empty -->
	{:else if orgs.length === 0}
		<div class="text-center py-20">
			<Building2 class="size-12 text-muted-foreground mx-auto mb-4" />
			<h3 class="text-lg font-semibold mb-1">No organizations yet</h3>
			<p class="text-sm text-muted-foreground mb-4">Create an organization to manage your businesses and subscription.</p>
			<button
				onclick={() => (showCreate = true)}
				class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
			>
				Create Organization
			</button>
		</div>

	<!-- List -->
	{:else}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each orgs as org (org.id)}
				<a
					href="/organizations/{org.id}"
					class="block rounded-lg border border-border bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all group"
				>
					<div class="flex items-start gap-3">
						<div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<Building2 class="size-5 text-primary" />
						</div>
						<div class="min-w-0 flex-1">
							<h3 class="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
								{org.name}
							</h3>
						</div>
					</div>
					<div class="mt-3 flex items-center gap-2">
						<span class="text-xs px-2 py-0.5 rounded-full {planClass(org.planKey)} inline-flex items-center gap-1">
							{#if org.planKey === PLAN_KEY.PRO}<Crown class="size-3" />{/if}
							{planLabel(org.planKey)}
						</span>
						<span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
							{org.role}
						</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
