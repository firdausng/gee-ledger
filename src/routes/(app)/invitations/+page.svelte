<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/client/api.svelte';
	import { Loader2, Mail, CheckCircle, XCircle } from '@lucide/svelte';

	type Invitation = {
		id: string;
		businessId: string;
		businessName: string;
		policyKey: string;
		status: string;
		expiresAt: string;
		createdAt: string;
	};

	let invitations = $state<Invitation[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let actionId = $state<string | null>(null);
	let actioning = $state(false);

	async function load() {
		try {
			loading = true;
			error = null;
			invitations = await api.get<Invitation[]>('/invitations');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
		}
	}

	async function respond(id: string, action: 'accept' | 'decline') {
		try {
			actioning = true;
			actionId = id;
			await api.post(`/invitations/${id}/${action}`, {});
			invitations = invitations.filter((i) => i.id !== id);
		} catch (e) {
			error = e instanceof Error ? e.message : `Failed to ${action} invitation`;
		} finally {
			actioning = false;
			actionId = null;
		}
	}

	function roleColor(role: string) {
		switch (role) {
			case 'owner': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
			case 'manager': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
			case 'cashier': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
			default: return 'bg-muted text-muted-foreground';
		}
	}

	onMount(load);
</script>

<div class="max-w-2xl">
	<h2 class="font-semibold text-foreground mb-4">Pending Invitations</h2>

	{#if error}
		<p class="text-destructive text-sm mb-4">{error}</p>
	{/if}

	{#if loading}
		<div class="flex justify-center py-12">
			<Loader2 class="size-7 animate-spin text-muted-foreground" />
		</div>
	{:else if invitations.length === 0}
		<div class="rounded-lg border border-border bg-card p-10 text-center">
			<Mail class="size-8 text-muted-foreground mx-auto mb-2" />
			<p class="text-muted-foreground text-sm">No pending invitations.</p>
			<p class="text-xs text-muted-foreground mt-1">
				When someone invites you to their business, it will appear here.
			</p>
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#each invitations as inv (inv.id)}
				<div class="rounded-lg border border-border bg-card p-4">
					<div class="flex items-start gap-3">
						<div class="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
							<Mail class="size-5 text-primary" />
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-semibold text-foreground">{inv.businessName}</p>
							<p class="text-sm text-muted-foreground mt-0.5">
								You've been invited to join as
								<span class="inline-block px-1.5 py-0.5 rounded-full text-xs font-medium {roleColor(inv.policyKey)}">
									{inv.policyKey}
								</span>
							</p>
							<p class="text-xs text-muted-foreground mt-1">
								Expires {new Date(inv.expiresAt).toLocaleDateString()}
							</p>
						</div>
					</div>
					<div class="flex gap-2 mt-4 justify-end">
						<button
							onclick={() => respond(inv.id, 'decline')}
							disabled={actioning && actionId === inv.id}
							class="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
						>
							{#if actioning && actionId === inv.id}
								<Loader2 class="size-4 animate-spin" />
							{:else}
								<XCircle class="size-4" />
							{/if}
							Decline
						</button>
						<button
							onclick={() => respond(inv.id, 'accept')}
							disabled={actioning && actionId === inv.id}
							class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
						>
							{#if actioning && actionId === inv.id}
								<Loader2 class="size-4 animate-spin" />
							{:else}
								<CheckCircle class="size-4" />
							{/if}
							Accept
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
