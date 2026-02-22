<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/client/api.svelte';
	import { Plus, Loader2, Trash2, Users, Mail } from '@lucide/svelte';

	type Member = {
		userId: string;
		policyKey: string;
		user: {
			id: string;
			email: string;
			displayName: string | null;
			photoURL: string | null;
		};
	};

	type Invitation = {
		id: string;
		email: string;
		policyKey: string;
		status: string;
		expiresAt: string;
	};

	const businessId = $page.params.businessId;
	let { data } = $props();

	const ROLES = ['owner', 'manager', 'cashier', 'viewer'] as const;

	let members = $state<Member[]>([]);
	let invitations = $state<Invitation[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Invite form
	let showInvite = $state(false);
	let inviteEmail = $state('');
	let inviteRole = $state<string>('viewer');
	let inviting = $state(false);
	let inviteError = $state<string | null>(null);
	let inviteSuccess = $state<string | null>(null);

	// Role update
	let updatingRole = $state<string | null>(null);

	// Remove
	let removeId = $state<string | null>(null);
	let removing = $state(false);

	// Cancel invite
	let cancelInviteId = $state<string | null>(null);
	let cancellingInvite = $state(false);

	async function load() {
		try {
			loading = true;
			error = null;
			const [mems, invs] = await Promise.all([
				api.get<Member[]>(`/businesses/${businessId}/members`),
				data.policyKey === 'owner'
					? api.get<Invitation[]>(`/businesses/${businessId}/invitations`)
					: Promise.resolve<Invitation[]>([])
			]);
			members = mems;
			invitations = invs;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
		}
	}

	async function invite() {
		if (!inviteEmail.trim()) return;
		try {
			inviting = true;
			inviteError = null;
			inviteSuccess = null;
			await api.post(`/businesses/${businessId}/invitations`, {
				email: inviteEmail.trim().toLowerCase(),
				policyKey: inviteRole
			});
			inviteSuccess = `Invitation sent to ${inviteEmail.trim()}.`;
			inviteEmail = '';
			inviteRole = 'viewer';
			showInvite = false;
			await load();
		} catch (e) {
			inviteError = e instanceof Error ? e.message : 'Failed to send invitation';
		} finally {
			inviting = false;
		}
	}

	async function updateRole(userId: string, newRole: string) {
		try {
			updatingRole = userId;
			await api.patch(`/businesses/${businessId}/members/${userId}/role`, { policyKey: newRole });
			members = members.map((m) =>
				m.userId === userId ? { ...m, policyKey: newRole } : m
			);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update role';
		} finally {
			updatingRole = null;
		}
	}

	async function removeMember(userId: string) {
		try {
			removing = true;
			await api.delete(`/businesses/${businessId}/members/${userId}`);
			members = members.filter((m) => m.userId !== userId);
			removeId = null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to remove member';
		} finally {
			removing = false;
		}
	}

	async function cancelInvitation(id: string) {
		try {
			cancellingInvite = true;
			await api.patch(`/businesses/${businessId}/invitations/${id}/cancel`, {});
			invitations = invitations.filter((i) => i.id !== id);
			cancelInviteId = null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to cancel invitation';
		} finally {
			cancellingInvite = false;
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
	<div class="flex items-center justify-between mb-4">
		<h2 class="font-semibold text-foreground">Members</h2>
		<button
			onclick={() => { showInvite = !showInvite; inviteError = null; inviteSuccess = null; }}
			class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
		>
			<Plus class="size-4" />
			Invite Member
		</button>
	</div>

	{#if inviteSuccess}
		<div class="mb-4 p-3 rounded-md bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-sm">{inviteSuccess}</div>
	{/if}

	{#if showInvite}
		<div class="rounded-lg border border-border bg-card p-4 mb-4">
			<h3 class="text-sm font-semibold mb-3">Invite Member</h3>
			{#if inviteError}
				<p class="text-destructive text-sm mb-2">{inviteError}</p>
			{/if}
			<div class="flex flex-col gap-3">
				<input
					type="email"
					bind:value={inviteEmail}
					placeholder="Email address"
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
				<select
					bind:value={inviteRole}
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				>
					{#each ROLES as r}
						<option value={r}>{r}</option>
					{/each}
				</select>
				<div class="flex justify-end gap-2">
					<button
						onclick={() => { showInvite = false; inviteError = null; }}
						class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
					>
						Cancel
					</button>
					<button
						onclick={invite}
						disabled={inviting || !inviteEmail.trim()}
						class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
					>
						{#if inviting}<Loader2 class="size-4 animate-spin" />{/if}
						Send Invite
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if error}
		<p class="text-destructive text-sm mb-4">{error}</p>
	{/if}

	{#if loading}
		<div class="flex justify-center py-12">
			<Loader2 class="size-7 animate-spin text-muted-foreground" />
		</div>
	{:else}
		<!-- Members list -->
		<div class="mb-6">
			<h3 class="text-sm font-medium text-muted-foreground mb-2">Active Members</h3>
			{#if members.length === 0}
				<div class="rounded-lg border border-border bg-card p-8 text-center">
					<Users class="size-7 text-muted-foreground mx-auto mb-2" />
					<p class="text-muted-foreground text-sm">No members yet.</p>
				</div>
			{:else}
				<div class="rounded-lg border border-border overflow-hidden">
					{#each members as member (member.userId)}
						<div class="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 bg-card">
							<div class="size-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
								{#if member.user.photoURL}
									<img src={member.user.photoURL} alt={member.user.displayName ?? member.user.email} class="size-8 object-cover" />
								{:else}
									<span class="text-xs font-semibold text-muted-foreground">
										{(member.user.displayName ?? member.user.email).charAt(0).toUpperCase()}
									</span>
								{/if}
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-foreground truncate">{member.user.displayName ?? member.user.email}</p>
								<p class="text-xs text-muted-foreground truncate">{member.user.email}</p>
							</div>
							{#if data.policyKey === 'owner' && member.policyKey !== 'owner'}
								<select
									value={member.policyKey}
									onchange={(e) => updateRole(member.userId, (e.target as HTMLSelectElement).value)}
									disabled={updatingRole === member.userId}
									class="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
								>
									{#each ROLES as r}
										<option value={r}>{r}</option>
									{/each}
								</select>
								<button
									onclick={() => (removeId = member.userId)}
									class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
								>
									<Trash2 class="size-3.5" />
								</button>
							{:else}
								<span class="text-xs px-2 py-0.5 rounded-full shrink-0 {roleColor(member.policyKey)}">
									{member.policyKey}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Pending invitations -->
		{#if invitations.length > 0}
			<div>
				<h3 class="text-sm font-medium text-muted-foreground mb-2">Pending Invitations</h3>
				<div class="rounded-lg border border-border overflow-hidden">
					{#each invitations as inv (inv.id)}
						<div class="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 bg-card">
							<Mail class="size-4 text-muted-foreground shrink-0" />
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-foreground truncate">{inv.email}</p>
								<p class="text-xs text-muted-foreground">
									Expires {new Date(inv.expiresAt).toLocaleDateString()}
								</p>
							</div>
							<span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0 capitalize">
								{inv.policyKey}
							</span>
							{#if data.policyKey === 'owner'}
								<button
									onclick={() => (cancelInviteId = inv.id)}
									class="text-xs text-muted-foreground hover:text-destructive"
								>
									Cancel
								</button>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- Remove member confirmation -->
{#if removeId}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
		<div class="bg-card rounded-lg border border-border p-6 max-w-sm w-full shadow-lg">
			<h3 class="font-semibold text-foreground mb-2">Remove Member?</h3>
			<p class="text-sm text-muted-foreground mb-5">This member will lose access to this business.</p>
			<div class="flex justify-end gap-2">
				<button
					onclick={() => (removeId = null)}
					class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
				>
					Cancel
				</button>
				<button
					onclick={() => removeMember(removeId!)}
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

<!-- Cancel invitation confirmation -->
{#if cancelInviteId}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
		<div class="bg-card rounded-lg border border-border p-6 max-w-sm w-full shadow-lg">
			<h3 class="font-semibold text-foreground mb-2">Cancel Invitation?</h3>
			<p class="text-sm text-muted-foreground mb-5">The invited person will no longer be able to join.</p>
			<div class="flex justify-end gap-2">
				<button
					onclick={() => (cancelInviteId = null)}
					class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
				>
					Keep
				</button>
				<button
					onclick={() => cancelInvitation(cancelInviteId!)}
					disabled={cancellingInvite}
					class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50"
				>
					{#if cancellingInvite}<Loader2 class="size-4 animate-spin" />{/if}
					Cancel Invite
				</button>
			</div>
		</div>
	</div>
{/if}
