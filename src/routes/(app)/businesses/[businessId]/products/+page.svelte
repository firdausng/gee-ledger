<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/client/api.svelte';
	import { PLAN_KEY } from '$lib/configurations/plans';
	import { Plus, Loader2, Pencil, Archive, ArchiveRestore, Package, Paperclip, FileText, Download, Crown, X } from '@lucide/svelte';

	type Product = {
		id: string;
		name: string;
		sku: string | null;
		description: string | null;
		defaultPrice: number;
		defaultQty: number;
		isActive: boolean;
	};

	type Attachment = {
		id: string;
		fileName: string;
		mimeType: string;
		fileSize: number;
	};

	const businessId = $page.params.businessId!;

	const canUploadAttachment = $derived(
		($page.data.navBusinesses as { id: string; planKey: string }[])
			?.find((b) => b.id === businessId)?.planKey === PLAN_KEY.PRO
	);

	let products = $state<Product[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let showArchived = $state(false);

	const displayProducts = $derived(
		showArchived ? products : products.filter((p) => p.isActive)
	);

	// Create form
	let showCreate = $state(false);
	let createName = $state('');
	let createSku = $state('');
	let createDescription = $state('');
	let createPrice = $state('');
	let createQty = $state(1);
	let creating = $state(false);
	let createError = $state<string | null>(null);
	let createAttachments = $state<Attachment[]>([]);
	let createUploading = $state(false);

	// Edit
	let editId = $state<string | null>(null);
	let editName = $state('');
	let editSku = $state('');
	let editDescription = $state('');
	let editPrice = $state('');
	let editQty = $state(1);
	let editing = $state(false);
	let editError = $state<string | null>(null);
	let editAttachments = $state<Attachment[]>([]);
	let editUploading = $state(false);
	let editAttachmentsLoading = $state(false);

	let archiving = $state<string | null>(null);

	function formatPrice(cents: number): string {
		return (cents / 100).toFixed(2);
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	async function load() {
		try {
			loading = true;
			error = null;
			products = await api.get<Product[]>(`/businesses/${businessId}/products?includeInactive=true`);
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
		createAttachments = [];
		showCreate = true;
	}

	async function uploadCreateFile(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		input.value = '';

		const fd = new FormData();
		fd.append('file', file);
		try {
			createUploading = true;
			const result = await api.upload<Attachment>(`/businesses/${businessId}/attachments`, fd);
			createAttachments = [...createAttachments, result];
		} catch (err) {
			createError = err instanceof Error ? err.message : 'Upload failed';
		} finally {
			createUploading = false;
		}
	}

	function removeCreateAttachment(id: string) {
		createAttachments = createAttachments.filter((a) => a.id !== id);
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
				defaultQty: createQty,
				attachmentIds: createAttachments.map((a) => a.id)
			});
			products = [...products, product];
			showCreate = false;
		} catch (e) {
			createError = e instanceof Error ? e.message : 'Failed to create';
		} finally {
			creating = false;
		}
	}

	async function startEdit(p: Product) {
		editId = p.id;
		editName = p.name;
		editSku = p.sku ?? '';
		editDescription = p.description ?? '';
		editPrice = formatPrice(p.defaultPrice);
		editQty = p.defaultQty;
		editError = null;
		editAttachments = [];

		if (canUploadAttachment) {
			try {
				editAttachmentsLoading = true;
				editAttachments = await api.get<Attachment[]>(`/businesses/${businessId}/products/${p.id}/attachments`);
			} catch {
				// Non-critical — just show empty
			} finally {
				editAttachmentsLoading = false;
			}
		}
	}

	async function uploadEditFile(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		input.value = '';

		const fd = new FormData();
		fd.append('file', file);
		try {
			editUploading = true;
			const result = await api.upload<Attachment>(`/businesses/${businessId}/attachments`, fd);
			editAttachments = [...editAttachments, result];
		} catch (err) {
			editError = err instanceof Error ? err.message : 'Upload failed';
		} finally {
			editUploading = false;
		}
	}

	function removeEditAttachment(id: string) {
		editAttachments = editAttachments.filter((a) => a.id !== id);
	}

	async function saveEdit() {
		if (!editId || !editName.trim()) return;
		const priceVal = Math.round((parseFloat(editPrice) || 0) * 100);
		try {
			editing = true;
			editError = null;
			const payload: Record<string, unknown> = {
				name: editName.trim(),
				sku: editSku.trim() || null,
				description: editDescription.trim() || null,
				defaultPrice: priceVal,
				defaultQty: editQty
			};
			if (canUploadAttachment) {
				payload.attachmentIds = editAttachments.map((a) => a.id);
			}
			const updated = await api.patch<Product>(`/businesses/${businessId}/products/${editId}`, payload);
			products = products.map((p) => (p.id === editId ? updated : p));
			editId = null;
		} catch (e) {
			editError = e instanceof Error ? e.message : 'Failed to update';
		} finally {
			editing = false;
		}
	}

	async function toggleArchive(product: Product) {
		try {
			archiving = product.id;
			const updated = await api.patch<Product>(`/businesses/${businessId}/products/${product.id}`, {
				isActive: !product.isActive
			});
			products = products.map((p) => (p.id === product.id ? updated : p));
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update';
		} finally {
			archiving = null;
		}
	}

	onMount(load);
</script>

{#snippet attachmentSection(attachments: Attachment[], uploading: boolean, onUpload: (e: Event) => void, onRemove: (id: string) => void)}
	{#if canUploadAttachment}
		<div>
			<div class="flex items-center justify-between mb-1">
				<span class="text-sm font-medium">Attachments</span>
				<label class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-xs font-medium cursor-pointer transition-colors">
					{#if uploading}
						<Loader2 class="size-3 animate-spin" />
						Uploading...
					{:else}
						<Paperclip class="size-3" />
						Attach file
					{/if}
					<input
						type="file"
						accept="image/jpeg,image/png,application/pdf"
						class="sr-only"
						disabled={uploading}
						onchange={onUpload}
					/>
				</label>
			</div>
			{#if attachments.length > 0}
				<div class="flex flex-col gap-1.5">
					{#each attachments as att (att.id)}
						<div class="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 text-sm">
							{#if att.mimeType.startsWith('image/')}
								<img
									src="/api/businesses/{businessId}/attachments/{att.id}/download"
									alt={att.fileName}
									class="size-8 rounded object-cover shrink-0"
								/>
							{:else}
								<FileText class="size-4 text-muted-foreground shrink-0" />
							{/if}
							<span class="flex-1 truncate text-xs">{att.fileName}</span>
							<span class="text-xs text-muted-foreground shrink-0">{formatFileSize(att.fileSize)}</span>
							<a
								href="/api/businesses/{businessId}/attachments/{att.id}/download"
								target="_blank"
								class="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
							>
								<Download class="size-3" />
							</a>
							<button
								onclick={() => onRemove(att.id)}
								class="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
							>
								<X class="size-3" />
							</button>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-xs text-muted-foreground">No attachments yet.</p>
			{/if}
		</div>
	{:else}
		<div class="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 text-sm">
			<Crown class="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
			<span class="text-amber-700 dark:text-amber-300">
				File attachments are available on the <a href="/organizations" class="underline font-medium">Pro plan</a>.
			</span>
		</div>
	{/if}
{/snippet}

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

	<label class="flex items-center gap-2 text-sm mb-4 cursor-pointer">
		<input type="checkbox" bind:checked={showArchived} class="accent-primary" />
		Show archived products
	</label>

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

				{@render attachmentSection(createAttachments, createUploading, uploadCreateFile, removeCreateAttachment)}

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
	{:else if displayProducts.length === 0}
		<div class="rounded-lg border border-border bg-card p-10 text-center">
			<Package class="size-8 text-muted-foreground mx-auto mb-2" />
			<p class="text-muted-foreground text-sm">{showArchived ? 'No products yet.' : 'No active products.'}</p>
		</div>
	{:else}
		<div class="rounded-lg border border-border overflow-hidden">
			{#each displayProducts as product (product.id)}
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
							{#if editAttachmentsLoading}
								<div class="flex items-center gap-2 text-xs text-muted-foreground">
									<Loader2 class="size-3 animate-spin" />
									Loading attachments...
								</div>
							{:else}
								{@render attachmentSection(editAttachments, editUploading, uploadEditFile, removeEditAttachment)}
							{/if}

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
								title="Edit"
							>
								<Pencil class="size-3.5" />
							</button>
							<button
								onclick={() => toggleArchive(product)}
								disabled={archiving === product.id}
								class="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50"
								title={product.isActive ? 'Archive' : 'Unarchive'}
							>
								{#if archiving === product.id}
									<Loader2 class="size-3.5 animate-spin" />
								{:else if product.isActive}
									<Archive class="size-3.5" />
								{:else}
									<ArchiveRestore class="size-3.5" />
								{/if}
							</button>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>

