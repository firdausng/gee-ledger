<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/client/api.svelte';
	import { toast } from 'svelte-sonner';
	import { Plus, Loader2, Trash2, Tag } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';

	type CategoryType = 'income' | 'expense' | 'general';

	type Category = {
		id: string;
		name: string;
		type: CategoryType;
		color: string | null;
		icon: string | null;
	};

	const TYPES: CategoryType[] = ['income', 'expense', 'general'];

	const businessId = $page.params.businessId!;

	let categories = $state<Category[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Filter
	let activeFilter = $state<'all' | CategoryType>('all');
	let filteredCategories = $derived(
		activeFilter === 'all' ? categories : categories.filter((c) => c.type === activeFilter)
	);

	// Create dialog
	let dialogOpen = $state(false);
	let dialogName = $state('');
	let dialogType = $state<CategoryType>('general');
	let saving = $state(false);
	let dialogError = $state<string | null>(null);

	// Delete
	let deleteTarget = $state<Category | null>(null);
	let deleting = $state(false);

	function typeBadgeClass(type: CategoryType) {
		switch (type) {
			case 'income': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
			case 'expense': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
			default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
		}
	}

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

	function openCreate() {
		dialogName = '';
		dialogType = 'general';
		dialogError = null;
		dialogOpen = true;
	}

	async function saveDialog() {
		if (!dialogName.trim()) return;
		try {
			saving = true;
			dialogError = null;
			const cat = await api.post<Category>(`/businesses/${businessId}/categories`, {
				name: dialogName.trim(),
				type: dialogType
			});
			categories = [...categories, cat];
			toast.success('Category created');
			dialogOpen = false;
		} catch (e) {
			dialogError = e instanceof Error ? e.message : 'Failed to save';
		} finally {
			saving = false;
		}
	}

	async function deleteCategory() {
		if (!deleteTarget) return;
		try {
			deleting = true;
			await api.delete(`/businesses/${businessId}/categories/${deleteTarget.id}`);
			categories = categories.filter((c) => c.id !== deleteTarget!.id);
			toast.success('Category deleted');
			deleteTarget = null;
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to delete');
		} finally {
			deleting = false;
		}
	}

	onMount(load);
</script>

<div>
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center gap-2">
			<Tag class="size-5 text-muted-foreground" />
			<div>
				<h2 class="font-semibold text-foreground">Categories</h2>
				<p class="text-xs text-muted-foreground mt-0.5">Organize transactions by type</p>
			</div>
		</div>
		<button
			onclick={openCreate}
			class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
		>
			<Plus class="size-4" />
			Add Category
		</button>
	</div>

	<!-- Filter -->
	<div class="flex gap-1 p-1 rounded-lg bg-muted mb-4 w-fit">
		{#each ['all', ...TYPES] as tab}
			<button
				onclick={() => (activeFilter = tab as 'all' | CategoryType)}
				class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors
					{activeFilter === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
			>
				{tab.charAt(0).toUpperCase() + tab.slice(1)}
			</button>
		{/each}
	</div>

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
			<p class="text-muted-foreground text-sm">{activeFilter === 'all' ? 'No categories yet.' : `No ${activeFilter} categories yet.`}</p>
			{#if categories.length === 0}
			<button
				onclick={openCreate}
				class="mt-3 text-sm text-primary hover:underline"
			>
				Create your first category
			</button>
		{/if}
		</div>
	{:else}
		<div class="rounded-lg border border-border overflow-hidden">
			{#each filteredCategories as cat (cat.id)}
				<div class="flex items-center border-b border-border last:border-0 bg-card hover:bg-muted/30 transition-colors">
					<a
						href="/businesses/{businessId}/categories/{cat.id}"
						class="flex items-center gap-3 px-4 py-3 flex-1 min-w-0"
					>
						<Tag class="size-4 text-muted-foreground shrink-0" />
						<p class="flex-1 text-sm font-medium text-foreground truncate">{cat.name}</p>
						<span class="text-xs px-2 py-0.5 rounded-full shrink-0 capitalize {typeBadgeClass(cat.type)}">
							{cat.type}
						</span>
					</a>
					<div class="flex items-center gap-1 px-2 shrink-0">
						<button
							onclick={() => (deleteTarget = cat)}
							class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
						>
							<Trash2 class="size-3.5" />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create dialog -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>New Category</Dialog.Title>
			<Dialog.Description>Add a new category to organize your transactions.</Dialog.Description>
		</Dialog.Header>
		{#if dialogError}
			<p class="text-destructive text-sm">{dialogError}</p>
		{/if}
		<div class="flex flex-col gap-4 py-2">
			<div>
				<label class="block text-sm font-medium text-foreground mb-1.5" for="cat-name">Name</label>
				<input
					id="cat-name"
					type="text"
					bind:value={dialogName}
					placeholder="e.g. Food & Beverage"
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-foreground mb-1.5">Type</label>
				<div class="flex gap-2">
					{#each TYPES as t}
						<button
							type="button"
							onclick={() => (dialogType = t)}
							class="flex-1 py-2 rounded-md border text-sm font-medium capitalize transition-colors
								{dialogType === t ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground hover:border-muted-foreground'}"
						>
							{t}
						</button>
					{/each}
				</div>
				<p class="text-xs text-muted-foreground mt-1.5">
					{#if dialogType === 'general'}
						Appears in both income and expense transactions.
					{:else}
						Only appears in {dialogType} transactions.
					{/if}
				</p>
			</div>
		</div>
		<Dialog.Footer>
			<Dialog.Close class="px-4 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted">
				Cancel
			</Dialog.Close>
			<button
				onclick={saveDialog}
				disabled={saving || !dialogName.trim()}
				class="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
			>
				{#if saving}<Loader2 class="size-4 animate-spin" />{/if}
				Create
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete confirmation -->
<AlertDialog.Root open={!!deleteTarget} onOpenChange={(open) => { if (!open) deleteTarget = null; }}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Category?</AlertDialog.Title>
			<AlertDialog.Description>
				{#if deleteTarget}
					<span class="font-medium text-foreground">{deleteTarget.name}</span> will be permanently deleted. This cannot be undone.
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<button
				onclick={deleteCategory}
				disabled={deleting}
				class="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
			>
				{#if deleting}<Loader2 class="size-4 animate-spin" />{/if}
				Delete
			</button>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
