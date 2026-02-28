<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/client/api.svelte';
	import { Plus, Loader2, Pencil, Trash2, BookOpen } from '@lucide/svelte';

	type Account = {
		id: string;
		name: string;
		type: string;
		code: string | null;
		parentId: string | null;
		isSystem: boolean;
	};

	const businessId = $page.params.businessId;

	const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'income', 'expense'] as const;

	let accounts = $state<Account[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let activeTab = $state('asset');

	let filteredAccounts = $derived(accounts.filter((a) => a.type === activeTab));

	// Accounts available as parents (same type, no parent of their own)
	let parentOptions = $derived(
		accounts.filter((a) => a.type === activeTab && !a.parentId)
	);

	// Create form
	let showCreate = $state(false);
	let createName = $state('');
	let createType = $state('asset');
	let createCode = $state('');
	let createParentId = $state('');
	let creating = $state(false);
	let createError = $state<string | null>(null);

	// Edit
	let editId = $state<string | null>(null);
	let editName = $state('');
	let editCode = $state('');
	let editing = $state(false);
	let editError = $state<string | null>(null);

	// Delete
	let deleteId = $state<string | null>(null);
	let deleting = $state(false);

	function getParentName(parentId: string | null) {
		if (!parentId) return null;
		return accounts.find((a) => a.id === parentId)?.name ?? null;
	}

	async function load() {
		try {
			loading = true;
			error = null;
			accounts = await api.get<Account[]>(`/businesses/${businessId}/accounts`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
		}
	}

	async function create() {
		if (!createName.trim()) return;
		try {
			creating = true;
			createError = null;
			const acc = await api.post<Account>(`/businesses/${businessId}/accounts`, {
				name: createName.trim(),
				type: createType,
				code: createCode.trim() || undefined,
				parentId: createParentId || undefined
			});
			accounts = [...accounts, acc];
			showCreate = false;
			createName = '';
			createCode = '';
			createParentId = '';
		} catch (e) {
			createError = e instanceof Error ? e.message : 'Failed to create';
		} finally {
			creating = false;
		}
	}

	function startEdit(acc: Account) {
		editId = acc.id;
		editName = acc.name;
		editCode = acc.code ?? '';
		editError = null;
	}

	async function saveEdit() {
		if (!editId || !editName.trim()) return;
		try {
			editing = true;
			editError = null;
			const updated = await api.patch<Account>(`/businesses/${businessId}/accounts/${editId}`, {
				name: editName.trim(),
				code: editCode.trim() || undefined
			});
			accounts = accounts.map((a) => (a.id === editId ? updated : a));
			editId = null;
		} catch (e) {
			editError = e instanceof Error ? e.message : 'Failed to update';
		} finally {
			editing = false;
		}
	}

	async function deleteAccount(id: string) {
		try {
			deleting = true;
			await api.delete(`/businesses/${businessId}/accounts/${id}`);
			accounts = accounts.filter((a) => a.id !== id);
			deleteId = null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete';
		} finally {
			deleting = false;
		}
	}

	onMount(load);
</script>

<div>
	<div class="flex items-center justify-between mb-4">
		<h2 class="font-semibold text-foreground">Accounts</h2>
		<button
			onclick={() => {
				showCreate = !showCreate;
				createType = activeTab;
				createParentId = '';
				createError = null;
			}}
			class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
		>
			<Plus class="size-4" />
			Add Account
		</button>
	</div>

	<!-- Type tabs -->
	<div class="flex gap-1 flex-wrap mb-4">
		{#each ACCOUNT_TYPES as t}
			<button
				onclick={() => (activeTab = t)}
				class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize
					{activeTab === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}"
			>
				{t}
			</button>
		{/each}
	</div>

	{#if showCreate}
		<div class="rounded-lg border border-border bg-card p-4 mb-4">
			<h3 class="text-sm font-semibold mb-3">New Account</h3>
			{#if createError}
				<p class="text-destructive text-sm mb-2">{createError}</p>
			{/if}
			<div class="flex flex-col gap-3">
				<input
					type="text"
					bind:value={createName}
					placeholder="Account name"
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
				<input
					type="text"
					bind:value={createCode}
					placeholder="Code (optional, e.g. 1000)"
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
				<div class="grid grid-cols-2 gap-2">
					<div>
						<label class="text-xs text-muted-foreground mb-1 block">Type</label>
						<select
							bind:value={createType}
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						>
							{#each ACCOUNT_TYPES as t}
								<option value={t}>{t}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="text-xs text-muted-foreground mb-1 block">Parent (optional)</label>
						<select
							bind:value={createParentId}
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						>
							<option value="">None</option>
							{#each parentOptions as p}
								<option value={p.id}>{p.name}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="flex justify-end gap-2">
					<button
						onclick={() => { showCreate = false; createError = null; }}
						class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
					>
						Cancel
					</button>
					<button
						onclick={create}
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

	{#if error}
		<p class="text-destructive text-sm mb-4">{error}</p>
	{/if}

	{#if loading}
		<div class="flex justify-center py-12">
			<Loader2 class="size-7 animate-spin text-muted-foreground" />
		</div>
	{:else if filteredAccounts.length === 0}
		<div class="rounded-lg border border-border bg-card p-10 text-center">
			<BookOpen class="size-8 text-muted-foreground mx-auto mb-2" />
			<p class="text-muted-foreground text-sm">No {activeTab} accounts yet.</p>
		</div>
	{:else}
		<div class="rounded-lg border border-border overflow-hidden">
			{#each filteredAccounts as acc (acc.id)}
				{#if editId === acc.id}
					<div class="p-4 border-b border-border last:border-0 bg-muted/30">
						{#if editError}
							<p class="text-destructive text-sm mb-2">{editError}</p>
						{/if}
						<div class="flex flex-col gap-2">
							<input
								type="text"
								bind:value={editName}
								placeholder="Account name"
								class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							/>
							<input
								type="text"
								bind:value={editCode}
								placeholder="Code (optional)"
								class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							/>
							<div class="flex justify-end gap-2">
								<button
									onclick={() => (editId = null)}
									class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
								>
									Cancel
								</button>
								<button
									onclick={saveEdit}
									disabled={editing || !editName.trim()}
									class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
								>
									{#if editing}<Loader2 class="size-4 animate-spin" />{/if}
									Save
								</button>
							</div>
						</div>
					</div>
				{:else}
					<div class="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 bg-card hover:bg-muted/30 transition-colors"
						style={acc.parentId ? 'padding-left: 2rem;' : ''}>
						<BookOpen class="size-4 text-muted-foreground shrink-0" />
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-foreground">{acc.name}</p>
							{#if acc.parentId}
								<p class="text-xs text-muted-foreground">Sub-account of {getParentName(acc.parentId)}</p>
							{/if}
						</div>
						{#if acc.code}
							<span class="text-xs text-muted-foreground font-mono shrink-0">{acc.code}</span>
						{/if}
						{#if acc.isSystem}
							<span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">system</span>
						{:else}
							<div class="flex items-center gap-1 shrink-0">
								<button
									onclick={() => startEdit(acc)}
									class="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
								>
									<Pencil class="size-3.5" />
								</button>
								<button
									onclick={() => (deleteId = acc.id)}
									class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
								>
									<Trash2 class="size-3.5" />
								</button>
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<!-- Delete confirmation -->
{#if deleteId}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
		<div class="bg-card rounded-lg border border-border p-6 max-w-sm w-full shadow-lg">
			<h3 class="font-semibold text-foreground mb-2">Delete Account?</h3>
			<p class="text-sm text-muted-foreground mb-5">This action cannot be undone.</p>
			<div class="flex justify-end gap-2">
				<button
					onclick={() => (deleteId = null)}
					class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
				>
					Cancel
				</button>
				<button
					onclick={() => deleteAccount(deleteId!)}
					disabled={deleting}
					class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50"
				>
					{#if deleting}<Loader2 class="size-4 animate-spin" />{/if}
					Delete
				</button>
			</div>
		</div>
	</div>
{/if}
