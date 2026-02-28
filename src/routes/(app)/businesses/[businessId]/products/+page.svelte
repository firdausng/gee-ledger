<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/client/api.svelte';
	import { Plus, Loader2, Pencil, Trash2, Package } from '@lucide/svelte';

	type Product = {
		id: string;
		name: string;
		sku: string | null;
		description: string | null;
		defaultPrice: number;
		defaultQty: number;
		isActive: boolean;
	};

	const businessId = $page.params.businessId!;

	let products = $state<Product[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Create form
	let showCreate = $state(false);
	let createName = $state('');
	let createSku = $state('');
	let createDescription = $state('');
	let createPrice = $state('');
	let createQty = $state(1);
	let creating = $state(false);
	let createError = $state<string | null>(null);

	// Edit
	let editId = $state<string | null>(null);
	let editName = $state('');
	let editSku = $state('');
	let editDescription = $state('');
	let editPrice = $state('');
	let editQty = $state(1);
	let editActive = $state(true);
	let editing = $state(false);
	let editError = $state<string | null>(null);

	// Delete
	let deleteId = $state<string | null>(null);
	let deleting = $state(false);

	function formatPrice(cents: number): string {
		return (cents / 100).toFixed(2);
	}

	async function load() {
		try {
			loading = true;
			error = null;
			products = await api.get<Product[]>(`/businesses/${businessId}/products`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
		}
	}

	function openCreate() {
		createName = '';
		createSku = '';
		createDescription = '';
		createPrice = '';
		createQty = 1;
		createError = null;
		showCreate = true;
	}

	async function create() {
		if (!createName.trim()) return;
		const priceVal = Math.round((parseFloat(createPrice) || 0) * 100);
		try {
			creating = true;
			createError = null;
			const product = await api.post<Product>(`/businesses/${businessId}/products`, {
				name: createName.trim(),
				sku: createSku.trim() || undefined,
				description: createDescription.trim() || undefined,
				defaultPrice: priceVal,
				defaultQty: createQty
			});
			products = [...products, product];
			showCreate = false;
		} catch (e) {
			createError = e instanceof Error ? e.message : 'Failed to create';
		} finally {
			creating = false;
		}
	}

	function startEdit(p: Product) {
		editId = p.id;
		editName = p.name;
		editSku = p.sku ?? '';
		editDescription = p.description ?? '';
		editPrice = formatPrice(p.defaultPrice);
		editQty = p.defaultQty;
		editActive = p.isActive;
		editError = null;
	}

	async function saveEdit() {
		if (!editId || !editName.trim()) return;
		const priceVal = Math.round((parseFloat(editPrice) || 0) * 100);
		try {
			editing = true;
			editError = null;
			const updated = await api.patch<Product>(`/businesses/${businessId}/products/${editId}`, {
				name: editName.trim(),
				sku: editSku.trim() || null,
				description: editDescription.trim() || null,
				defaultPrice: priceVal,
				defaultQty: editQty,
				isActive: editActive
			});
			products = products.map((p) => (p.id === editId ? updated : p));
			editId = null;
		} catch (e) {
			editError = e instanceof Error ? e.message : 'Failed to update';
		} finally {
			editing = false;
		}
	}

	async function deleteProduct(id: string) {
		try {
			deleting = true;
			await api.delete(`/businesses/${businessId}/products/${id}`);
			products = products.filter((p) => p.id !== id);
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
		<h2 class="font-semibold text-foreground">Products</h2>
		<button
			onclick={openCreate}
			class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
		>
			<Plus class="size-4" />
			Add Product
		</button>
	</div>

	{#if showCreate}
		<div class="rounded-lg border border-border bg-card p-4 mb-4">
			<h3 class="text-sm font-semibold mb-3">New Product</h3>
			{#if createError}
				<p class="text-destructive text-sm mb-2">{createError}</p>
			{/if}
			<div class="flex flex-col gap-3">
				<div>
					<label class="text-sm font-medium block mb-1" for="create-name">
						Name <span class="text-destructive">*</span>
					</label>
					<input
						id="create-name"
						type="text"
						bind:value={createName}
						placeholder="e.g. Logo Design"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="text-sm font-medium block mb-1" for="create-price">
							Default Price <span class="text-destructive">*</span>
						</label>
						<input
							id="create-price"
							type="number"
							bind:value={createPrice}
							placeholder="0.00"
							min="0"
							step="0.01"
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>
					<div>
						<label class="text-sm font-medium block mb-1" for="create-qty">Default Qty</label>
						<input
							id="create-qty"
							type="number"
							bind:value={createQty}
							min="1"
							step="1"
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>
				</div>
				<div>
					<label class="text-sm font-medium block mb-1" for="create-sku">SKU</label>
					<input
						id="create-sku"
						type="text"
						bind:value={createSku}
						placeholder="Optional"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>
				<div>
					<label class="text-sm font-medium block mb-1" for="create-desc">Description</label>
					<input
						id="create-desc"
						type="text"
						bind:value={createDescription}
						placeholder="Optional"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
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
	{:else if products.length === 0}
		<div class="rounded-lg border border-border bg-card p-10 text-center">
			<Package class="size-8 text-muted-foreground mx-auto mb-2" />
			<p class="text-muted-foreground text-sm">No products yet.</p>
		</div>
	{:else}
		<div class="rounded-lg border border-border overflow-hidden">
			{#each products as product (product.id)}
				{#if editId === product.id}
					<div class="p-4 border-b border-border last:border-0 bg-muted/30">
						{#if editError}
							<p class="text-destructive text-sm mb-2">{editError}</p>
						{/if}
						<div class="flex flex-col gap-3">
							<div>
								<label class="text-sm font-medium block mb-1" for="edit-name">Name</label>
								<input
									id="edit-name"
									type="text"
									bind:value={editName}
									class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
								/>
							</div>
							<div class="grid grid-cols-2 gap-3">
								<div>
									<label class="text-sm font-medium block mb-1" for="edit-price">Default Price</label>
									<input
										id="edit-price"
										type="number"
										bind:value={editPrice}
										min="0"
										step="0.01"
										class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
									/>
								</div>
								<div>
									<label class="text-sm font-medium block mb-1" for="edit-qty">Default Qty</label>
									<input
										id="edit-qty"
										type="number"
										bind:value={editQty}
										min="1"
										step="1"
										class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
									/>
								</div>
							</div>
							<div>
								<label class="text-sm font-medium block mb-1" for="edit-sku">SKU</label>
								<input
									id="edit-sku"
									type="text"
									bind:value={editSku}
									placeholder="Optional"
									class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
								/>
							</div>
							<div>
								<label class="text-sm font-medium block mb-1" for="edit-desc">Description</label>
								<input
									id="edit-desc"
									type="text"
									bind:value={editDescription}
									placeholder="Optional"
									class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
								/>
							</div>
							<label class="flex items-center gap-2 text-sm cursor-pointer">
								<input type="checkbox" bind:checked={editActive} class="accent-primary" />
								Active
							</label>
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
					<div class="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 bg-card hover:bg-muted/30 transition-colors {!product.isActive ? 'opacity-50' : ''}">
						<Package class="size-4 text-muted-foreground shrink-0" />
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-foreground truncate">
								{product.name}
								{#if product.sku}
									<span class="text-muted-foreground font-normal">({product.sku})</span>
								{/if}
							</p>
							{#if product.description}
								<p class="text-xs text-muted-foreground truncate">{product.description}</p>
							{/if}
						</div>
						<span class="text-sm tabular-nums text-muted-foreground shrink-0">
							{formatPrice(product.defaultPrice)} x {product.defaultQty}
						</span>
						{#if !product.isActive}
							<span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">Inactive</span>
						{/if}
						<div class="flex items-center gap-1 shrink-0">
							<button
								onclick={() => startEdit(product)}
								class="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
							>
								<Pencil class="size-3.5" />
							</button>
							<button
								onclick={() => (deleteId = product.id)}
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
			<h3 class="font-semibold text-foreground mb-2">Delete Product?</h3>
			<p class="text-sm text-muted-foreground mb-5">This action cannot be undone.</p>
			<div class="flex justify-end gap-2">
				<button
					onclick={() => (deleteId = null)}
					class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
				>
					Cancel
				</button>
				<button
					onclick={() => deleteProduct(deleteId!)}
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
