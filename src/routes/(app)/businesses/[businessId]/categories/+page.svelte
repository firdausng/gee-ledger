<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/client/api.svelte';
	import { Plus, Loader2, Pencil, Trash2, Tag } from '@lucide/svelte';

	type Category = {
		id: string;
		name: string;
		type: 'income' | 'expense';
		color: string | null;
		icon: string | null;
	};

	const businessId = $page.params.businessId!;

	let categories = $state<Category[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Tabs
	let activeTab = $state<'income' | 'expense'>('income');

	let filteredCategories = $derived(categories.filter((c) => c.type === activeTab));

	// Create form
	let showCreate = $state(false);
	let createName = $state('');
	let createType = $state<'income' | 'expense'>('income');
	let creating = $state(false);
	let createError = $state<string | null>(null);

	// Edit
	let editId = $state<string | null>(null);
	let editName = $state('');
	let editing = $state(false);
	let editError = $state<string | null>(null);

	// Delete
	let deleteId = $state<string | null>(null);
	let deleting = $state(false);

	async function load() {
		try {
			loading = true;
			error = null;
			categories = await api.get<Category[]>(`/businesses/${businessId}/categories`);
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
			const cat = await api.post<Category>(`/businesses/${businessId}/categories`, {
				name: createName.trim(),
				type: createType
			});
			categories = [...categories, cat];
			showCreate = false;
			createName = '';
		} catch (e) {
			createError = e instanceof Error ? e.message : 'Failed to create';
		} finally {
			creating = false;
		}
	}

	function startEdit(cat: Category) {
		editId = cat.id;
		editName = cat.name;
		editError = null;
	}

	async function saveEdit() {
		if (!editId || !editName.trim()) return;
		try {
			editing = true;
			editError = null;
			const updated = await api.patch<Category>(`/businesses/${businessId}/categories/${editId}`, {
				name: editName.trim()
			});
			categories = categories.map((c) => (c.id === editId ? updated : c));
			editId = null;
		} catch (e) {
			editError = e instanceof Error ? e.message : 'Failed to update';
		} finally {
			editing = false;
		}
	}

	async function deleteCategory(id: string) {
		try {
			deleting = true;
			await api.delete(`/businesses/${businessId}/categories/${id}`);
			categories = categories.filter((c) => c.id !== id);
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
		<h2 class="font-semibold text-foreground">Categories</h2>
		<button
			onclick={() => {
				showCreate = !showCreate;
				createType = activeTab;
				createError = null;
			}}
			class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
		>
			<Plus class="size-4" />
			Add Category
		</button>
	</div>

	<!-- Tabs -->
	<div class="flex gap-1 p-1 rounded-lg bg-muted mb-4 w-fit">
		{#each ['income', 'expense'] as tab}
			<button
				onclick={() => (activeTab = tab as 'income' | 'expense')}
				class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors
					{activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
			>
				{tab.charAt(0).toUpperCase() + tab.slice(1)}
			</button>
		{/each}
	</div>

	{#if showCreate}
		<div class="rounded-lg border border-border bg-card p-4 mb-4">
			<h3 class="text-sm font-semibold mb-3">New Category</h3>
			{#if createError}
				<p class="text-destructive text-sm mb-2">{createError}</p>
			{/if}
			<div class="flex flex-col gap-3">
				<input
					type="text"
					bind:value={createName}
					placeholder="Category name"
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
				<div class="flex gap-2">
					{#each ['income', 'expense'] as t}
						<button
							type="button"
							onclick={() => (createType = t as 'income' | 'expense')}
							class="flex-1 py-1.5 rounded-md border text-sm font-medium capitalize transition-colors
								{createType === t ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground hover:border-muted-foreground'}"
						>
							{t}
						</button>
					{/each}
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
	{:else if filteredCategories.length === 0}
		<div class="rounded-lg border border-border bg-card p-10 text-center">
			<Tag class="size-8 text-muted-foreground mx-auto mb-2" />
			<p class="text-muted-foreground text-sm">No {activeTab} categories yet.</p>
		</div>
	{:else}
		<div class="rounded-lg border border-border overflow-hidden">
			{#each filteredCategories as cat (cat.id)}
				{#if editId === cat.id}
					<div class="p-4 border-b border-border last:border-0 bg-muted/30">
						{#if editError}
							<p class="text-destructive text-sm mb-2">{editError}</p>
						{/if}
						<div class="flex gap-2">
							<input
								type="text"
								bind:value={editName}
								class="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							/>
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
				{:else}
					<div class="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 bg-card hover:bg-muted/30 transition-colors">
						<Tag class="size-4 text-muted-foreground shrink-0" />
						<p class="flex-1 text-sm font-medium text-foreground">{cat.name}</p>
						<span
							class="text-xs px-2 py-0.5 rounded-full shrink-0
								{cat.type === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}"
						>
							{cat.type}
						</span>
						<div class="flex items-center gap-1 shrink-0">
							<button
								onclick={() => startEdit(cat)}
								class="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
							>
								<Pencil class="size-3.5" />
							</button>
							<button
								onclick={() => (deleteId = cat.id)}
								class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
							>
								<Trash2 class="size-3.5" />
							</button>
						</div>
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
			<h3 class="font-semibold text-foreground mb-2">Delete Category?</h3>
			<p class="text-sm text-muted-foreground mb-5">This action cannot be undone.</p>
			<div class="flex justify-end gap-2">
				<button
					onclick={() => (deleteId = null)}
					class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
				>
					Cancel
				</button>
				<button
					onclick={() => deleteCategory(deleteId!)}
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
