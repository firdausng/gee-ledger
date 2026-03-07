<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/client/api.svelte';
	import { ArrowLeft, Loader2, Tag } from '@lucide/svelte';

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
	const categoryId = $page.params.categoryId!;

	let category = $state<Category | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let editName = $state('');
	let editType = $state<CategoryType>('general');
	let saving = $state(false);
	let saveError = $state<string | null>(null);
	let saveSuccess = $state(false);

	function populateFields(cat: Category) {
		editName = cat.name;
		editType = cat.type;
	}

	const hasChanges = $derived.by(() => {
		if (!category) return false;
		return editName.trim() !== category.name || editType !== category.type;
	});

	async function save() {
		if (!editName.trim()) return;
		try {
			saving = true;
			saveError = null;
			saveSuccess = false;
			category = await api.patch<Category>(`/businesses/${businessId}/categories/${categoryId}`, {
				name: editName.trim(),
				type: editType
			});
			populateFields(category);
			saveSuccess = true;
			setTimeout(() => (saveSuccess = false), 2000);
		} catch (e) {
			saveError = e instanceof Error ? e.message : 'Failed to update';
		} finally {
			saving = false;
		}
	}

	function discard() {
		if (category) populateFields(category);
		saveError = null;
	}

	async function load() {
		try {
			loading = true;
			error = null;
			const cat = await api.get<Category>(`/businesses/${businessId}/categories/${categoryId}`);
			category = cat;
			populateFields(cat);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<div>
	{#if loading}
		<div class="flex justify-center py-16"><Loader2 class="size-7 animate-spin text-muted-foreground" /></div>
	{:else if error && !category}
		<p class="text-destructive text-sm text-center py-8">{error}</p>
	{:else if category}
		<div class="flex items-center gap-2 mb-4">
			<a href="/businesses/{businessId}/categories" class="p-1 rounded text-muted-foreground hover:text-foreground shrink-0">
				<ArrowLeft class="size-4" />
			</a>
			<h2 class="text-lg font-semibold text-foreground">Category Details</h2>
		</div>

		<div class="rounded-lg border border-border bg-card p-4">
			{#if saveError}<p class="text-destructive text-sm mb-3">{saveError}</p>{/if}
			<div class="flex flex-col gap-3">
				<div>
					<label for="cat-name" class="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
					<input id="cat-name" type="text" bind:value={editName} placeholder="e.g. Food & Beverage"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
				</div>
				<div>
					<label class="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
					<div class="flex gap-2">
						{#each TYPES as t}
							<button
								type="button"
								onclick={() => (editType = t)}
								class="flex-1 py-2 rounded-md border text-sm font-medium capitalize transition-colors
									{editType === t ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground hover:border-muted-foreground'}"
							>
								{t}
							</button>
						{/each}
					</div>
					<p class="text-xs text-muted-foreground mt-1.5">
						{#if editType === 'general'}
							Appears in both income and expense transactions.
						{:else}
							Only appears in {editType} transactions.
						{/if}
					</p>
				</div>
				{#if hasChanges}
					<div class="flex items-center gap-2 justify-end pt-1">
						<button onclick={discard} class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted">Discard</button>
						<button onclick={save} disabled={saving || !editName.trim()}
							class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
							{#if saving}<Loader2 class="size-3.5 animate-spin" />{/if}
							Save changes
						</button>
					</div>
				{/if}
				{#if saveSuccess}
					<p class="text-xs text-success-fg text-right">Saved!</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
