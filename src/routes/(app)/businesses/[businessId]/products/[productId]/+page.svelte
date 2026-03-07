<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	import { api } from '$lib/client/api.svelte';
	import { PLAN_KEY } from '$lib/configurations/plans';
	import {
		ArrowLeft, Loader2, Package, Paperclip, FileText, Download, Crown, X
	} from '@lucide/svelte';

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
	const productId = $page.params.productId!;

	const canUploadAttachment = $derived(
		($page.data.navBusinesses as { id: string; planKey: string }[])
			?.find((b) => b.id === businessId)?.planKey === PLAN_KEY.PRO
	);

	let product = $state<Product | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Editable fields (always visible)
	let editName = $state('');
	let editSku = $state('');
	let editDescription = $state('');
	let editPrice = $state('');
	let editQty = $state(1);
	let saving = $state(false);
	let saveSuccess = $state(false);

	// Attachments
	let attachments = $state<Attachment[]>([]);
	let attachmentsLoading = $state(false);
	let uploading = $state(false);

	function formatPrice(cents: number): string {
		return (cents / 100).toFixed(2);
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function populateFields(p: Product) {
		editName = p.name;
		editSku = p.sku ?? '';
		editDescription = p.description ?? '';
		editPrice = formatPrice(p.defaultPrice);
		editQty = p.defaultQty;
	}

	const hasChanges = $derived.by(() => {
		if (!product) return false;
		const priceVal = Math.round((parseFloat(editPrice) || 0) * 100);
		return (
			editName.trim() !== product.name ||
			(editSku.trim() || null) !== (product.sku || null) ||
			(editDescription.trim() || null) !== (product.description || null) ||
			priceVal !== product.defaultPrice ||
			editQty !== product.defaultQty
		);
	});

	async function save() {
		if (!editName.trim()) return;
		const priceVal = Math.round((parseFloat(editPrice) || 0) * 100);
		try {
			saving = true;
			saveSuccess = false;
			const payload: Record<string, unknown> = {
				name: editName.trim(),
				sku: editSku.trim() || null,
				description: editDescription.trim() || null,
				defaultPrice: priceVal,
				defaultQty: editQty
			};
			if (canUploadAttachment) {
				payload.attachmentIds = attachments.map((a) => a.id);
			}
			product = await api.patch<Product>(`/businesses/${businessId}/products/${productId}`, payload);
			populateFields(product);
			saveSuccess = true;
			setTimeout(() => (saveSuccess = false), 2000);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to update');
		} finally {
			saving = false;
		}
	}

	function discard() {
		if (product) populateFields(product);
	}

	async function uploadFile(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		input.value = '';

		const fd = new FormData();
		fd.append('file', file);
		try {
			uploading = true;
			const result = await api.upload<Attachment>(`/businesses/${businessId}/attachments`, fd);
			attachments = [...attachments, result];
			// Auto-save attachment linkage
			await api.patch(`/businesses/${businessId}/products/${productId}`, {
				attachmentIds: attachments.map((a) => a.id)
			});
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Upload failed');
		} finally {
			uploading = false;
		}
	}

	async function removeAttachment(id: string) {
		attachments = attachments.filter((a) => a.id !== id);
		try {
			await api.patch(`/businesses/${businessId}/products/${productId}`, {
				attachmentIds: attachments.map((a) => a.id)
			});
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to remove attachment');
		}
	}

	async function load() {
		try {
			loading = true;
			error = null;
			const p = await api.get<Product>(`/businesses/${businessId}/products/${productId}`);
			product = p;
			populateFields(p);

			if (canUploadAttachment) {
				try {
					attachmentsLoading = true;
					attachments = await api.get<Attachment[]>(`/businesses/${businessId}/products/${productId}/attachments`);
				} catch {
					// Non-critical
				} finally {
					attachmentsLoading = false;
				}
			}
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
	{:else if error && !product}
		<p class="text-destructive text-sm text-center py-8">{error}</p>
	{:else if product}
		<!-- Back link -->
		<div class="flex items-center gap-2 mb-4">
			<a
				href="/businesses/{businessId}/products"
				class="p-1 rounded text-muted-foreground hover:text-foreground shrink-0"
			>
				<ArrowLeft class="size-4" />
			</a>
			<h2 class="text-lg font-semibold text-foreground">Product Details</h2>
			{#if !product.isActive}
				<span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inactive</span>
			{/if}
		</div>

		<!-- Product form (always editable) -->
		<div class="rounded-lg border border-border bg-card p-4 mb-6">
			<div class="flex flex-col gap-3">
				<div>
					<label for="product-name" class="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
					<input id="product-name" type="text" bind:value={editName} placeholder="e.g. Logo Design"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
				</div>
				<div class="grid sm:grid-cols-2 gap-3">
					<div>
						<label for="product-price" class="text-xs font-medium text-muted-foreground mb-1 block">Default Price *</label>
						<input id="product-price" type="number" bind:value={editPrice} placeholder="0.00" min="0" step="0.01"
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
					</div>
					<div>
						<label for="product-qty" class="text-xs font-medium text-muted-foreground mb-1 block">Default Qty</label>
						<input id="product-qty" type="number" bind:value={editQty} min="1" step="1"
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
					</div>
				</div>
				<div>
					<label for="product-sku" class="text-xs font-medium text-muted-foreground mb-1 block">SKU</label>
					<input id="product-sku" type="text" bind:value={editSku} placeholder="Optional"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
				</div>
				<div>
					<label for="product-desc" class="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
					<input id="product-desc" type="text" bind:value={editDescription} placeholder="Optional"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
				</div>

				{#if hasChanges}
					<div class="flex items-center gap-2 justify-end pt-1">
						<button
							onclick={discard}
							class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
						>
							Discard
						</button>
						<button
							onclick={save}
							disabled={saving || !editName.trim()}
							class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
						>
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

		<!-- Attachments -->
		<div class="rounded-lg border border-border bg-card p-4">
			<h3 class="text-sm font-semibold text-foreground mb-3">Attachments</h3>
			{#if canUploadAttachment}
				{#if attachmentsLoading}
					<div class="flex items-center gap-2 text-xs text-muted-foreground">
						<Loader2 class="size-3 animate-spin" />
						Loading attachments...
					</div>
				{:else}
					{#if attachments.length > 0}
						<div class="flex flex-col gap-1.5 mb-3">
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
										onclick={() => removeAttachment(att.id)}
										class="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
									>
										<X class="size-3" />
									</button>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-xs text-muted-foreground mb-3">No attachments yet.</p>
					{/if}
					<label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-xs font-medium cursor-pointer transition-colors">
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
							onchange={uploadFile}
						/>
					</label>
				{/if}
			{:else}
				<div class="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 text-sm">
					<Crown class="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
					<span class="text-amber-700 dark:text-amber-300">
						File attachments are available on the <a href="/organizations" class="underline font-medium">Pro plan</a>.
					</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
