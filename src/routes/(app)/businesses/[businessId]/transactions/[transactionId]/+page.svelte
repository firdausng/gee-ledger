<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api } from '$lib/client/api.svelte';
	import { ArrowLeft, Loader2, Paperclip, Trash2, Download, FileImage, FileText, Plus, X, Star, Printer, Mail } from '@lucide/svelte';
	import LineItemsEditor from '$lib/components/LineItemsEditor.svelte';

	type Location = { id: string; name: string; type: string };
	type Channel = { id: string; name: string; type: string };
	type Category = { id: string; name: string; type: string };
	type Contact  = { id: string; name: string; isClient: boolean; isSupplier: boolean };
	type Transaction = {
		id: string;
		type: 'income' | 'expense' | 'transfer';
		transactionDate: string;
		amount: number;
		locationId: string;
		salesChannelId: string | null;
		categoryId: string | null;
		contactId: string | null;
		note: string | null;
		referenceNo: string | null;
		invoiceNo: string | null;
		featuredImageId: string | null;
	};
	type Attachment = {
		id: string;
		fileName: string;
		mimeType: string;
		fileSize: number;
		createdAt: string;
	};
	type LineItem = { description: string; quantity: number; unitPrice: string };

	const businessId = $page.params.businessId;
	const transactionId = $page.params.transactionId;

	let locations = $state<Location[]>([]);
	let channels = $state<Channel[]>([]);
	let categories = $state<Category[]>([]);
	let contacts = $state<Contact[]>([]);
	let loadingMeta = $state(true);

	// Form fields
	let type = $state<'income' | 'expense' | 'transfer'>('income');
	let transactionDate = $state('');
	let locationId = $state('');
	let salesChannelId = $state('');
	let categoryId = $state('');
	let contactId = $state('');
	let note = $state('');
	let referenceNo = $state('');
	let invoiceNo = $state('');
	let featuredImageId = $state<string | null>(null);

	let submitting = $state(false);
	let submitError = $state<string | null>(null);
	let loadError = $state<string | null>(null);

	let showDeleteConfirm = $state(false);
	let deleting = $state(false);

	let filteredCategories  = $derived(categories.filter((c) => c.type === type || type === 'transfer'));
	let clientContacts   = $derived(contacts.filter((c) => c.isClient));
	let supplierContacts = $derived(contacts.filter((c) => c.isSupplier));

	// Attachments
	let attachmentsList = $state<Attachment[]>([]);
	let uploadingFile = $state(false);
	let uploadError = $state<string | null>(null);
	let deletingAttachmentId = $state<string | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	const MAX_FILE_SIZE = 10 * 1024 * 1024;

	// Line items
	let items = $state<LineItem[]>([]);

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function isImageMime(mime: string): boolean {
		return mime.startsWith('image/');
	}

	async function loadMeta() {
		try {
			loadingMeta = true;
			loadError = null;
			const [locs, chans, cats, conts, tx, atts, txItems] = await Promise.all([
				api.get<Location[]>(`/businesses/${businessId}/locations`),
				api.get<Channel[]>(`/businesses/${businessId}/channels`),
				api.get<Category[]>(`/businesses/${businessId}/categories`),
				api.get<Contact[]>(`/businesses/${businessId}/contacts`),
				api.get<Transaction>(`/businesses/${businessId}/transactions/${transactionId}`),
				api.get<Attachment[]>(`/businesses/${businessId}/transactions/${transactionId}/attachments`),
				api.get<{ id: string; description: string; quantity: number; unitPrice: number; sortOrder: number }[]>(
					`/businesses/${businessId}/transactions/${transactionId}/items`
				)
			]);
			locations = locs;
			channels = chans;
			categories = cats;
			contacts = conts;
			attachmentsList = atts;

			type = tx.type;
			transactionDate = tx.transactionDate;
				locationId = tx.locationId;
			salesChannelId = tx.salesChannelId ?? '';
			categoryId = tx.categoryId ?? '';
			contactId = tx.contactId ?? '';
			note = tx.note ?? '';
			referenceNo = tx.referenceNo ?? '';
			invoiceNo = tx.invoiceNo ?? '';
			featuredImageId = tx.featuredImageId ?? null;

			items = txItems.map((i) => ({
				description: i.description,
				quantity: i.quantity,
				unitPrice: (i.unitPrice / 100).toFixed(2)
			}));
		} catch (e) {
			loadError = e instanceof Error ? e.message : 'Failed to load transaction';
		} finally {
			loadingMeta = false;
		}
	}

	async function submit() {
		if (!locationId || !transactionDate) return;
		if (type === 'income' && !salesChannelId) {
			submitError = 'Sales channel is required for income transactions.';
			return;
		}
		if (items.length === 0) {
			submitError = 'Add at least one line item.';
			return;
		}

		try {
			submitting = true;
			submitError = null;
			const total = items.reduce(
				(sum, i) => sum + Math.round(parseFloat(i.unitPrice || '0') * 100) * i.quantity, 0
			);
			await api.patch(`/businesses/${businessId}/transactions/${transactionId}`, {
				type,
				transactionDate,
				amount: total,
				locationId,
				salesChannelId: salesChannelId || undefined,
				categoryId: categoryId || undefined,
				contactId: contactId || null,
				note: note.trim() || undefined,
				referenceNo: referenceNo.trim() || undefined,
				invoiceNo: invoiceNo.trim() || null,
				featuredImageId: featuredImageId ?? null
			});
			await api.put(`/businesses/${businessId}/transactions/${transactionId}/items`,
				items.map((item, idx) => ({
					description: item.description,
					quantity: item.quantity,
					unitPrice: Math.round(parseFloat(item.unitPrice) * 100) || 0,
					sortOrder: idx
				}))
			);
			goto(`/businesses/${businessId}/transactions`);
		} catch (e) {
			submitError = e instanceof Error ? e.message : 'Failed to update transaction';
		} finally {
			submitting = false;
		}
	}

	async function deleteTransaction() {
		try {
			deleting = true;
			await api.delete(`/businesses/${businessId}/transactions/${transactionId}`);
			goto(`/businesses/${businessId}/transactions`);
		} catch {
			deleting = false;
			showDeleteConfirm = false;
		}
	}

	async function uploadFile(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploadError = null;

		if (file.size > MAX_FILE_SIZE) {
			uploadError = 'File exceeds the 10 MB limit.';
			input.value = '';
			return;
		}

		try {
			uploadingFile = true;
			const form = new FormData();
			form.append('file', file);
			const result = await api.upload<Attachment>(
				`/businesses/${businessId}/transactions/${transactionId}/attachments`,
				form
			);
			attachmentsList = [...attachmentsList, result];
		} catch (e) {
			uploadError = e instanceof Error ? e.message : 'Upload failed.';
		} finally {
			uploadingFile = false;
			input.value = '';
		}
	}

	async function deleteAttachment(id: string) {
		try {
			deletingAttachmentId = id;
			await api.delete(`/businesses/${businessId}/attachments/${id}`);
			attachmentsList = attachmentsList.filter((a) => a.id !== id);
			if (featuredImageId === id) {
				featuredImageId = null;
				await api.patch(`/businesses/${businessId}/transactions/${transactionId}`, { featuredImageId: null });
			}
		} catch (e) {
			uploadError = e instanceof Error ? e.message : 'Failed to delete attachment.';
		} finally {
			deletingAttachmentId = null;
		}
	}

	async function toggleFeatured(att: Attachment) {
		const newId = featuredImageId === att.id ? null : att.id;
		try {
			await api.patch(`/businesses/${businessId}/transactions/${transactionId}`, { featuredImageId: newId });
			featuredImageId = newId;
		} catch (e) {
			uploadError = e instanceof Error ? e.message : 'Failed to update featured image.';
		}
	}

	function downloadUrl(attachmentId: string) {
		return `/api/businesses/${businessId}/attachments/${attachmentId}/download`;
	}

	onMount(loadMeta);
</script>

<div class="max-w-lg">
	<div class="flex items-center justify-between mb-5">
		<a
			href="/businesses/{businessId}/transactions"
			class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
		>
			<ArrowLeft class="size-3.5" />
			Back
		</a>
		{#if !loadingMeta && !loadError}
			<div class="flex items-center gap-2">
				<a
					href="/businesses/{businessId}/transactions/{transactionId}/email"
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
					title="Email invoice"
				>
					<Mail class="size-3.5" />
					Email
				</a>
				<a
					href="/businesses/{businessId}/transactions/{transactionId}/print"
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
					title="View / Print PDF"
				>
					<Printer class="size-3.5" />
					PDF
				</a>
				<button
					type="button"
					onclick={() => (showDeleteConfirm = true)}
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input bg-background text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
					title="Delete transaction"
				>
					<Trash2 class="size-3.5" />
					Delete
				</button>
			</div>
		{/if}
	</div>

	{#if loadError}
		<div class="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{loadError}</div>
	{:else if loadingMeta}
		<div class="flex justify-center py-16">
			<Loader2 class="size-7 animate-spin text-muted-foreground" />
		</div>
	{:else}
		{#if submitError}
			<div class="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{submitError}</div>
		{/if}

		<div class="flex flex-col gap-5">
			<!-- Type -->
			<div>
				<label class="text-sm font-medium block mb-1.5">Type <span class="text-destructive">*</span></label>
				<div class="flex gap-2">
					{#each ['income', 'expense', 'transfer'] as t}
						<button
							type="button"
							onclick={() => { type = t as typeof type; salesChannelId = ''; categoryId = ''; contactId = ''; }}
							class="flex-1 py-2 rounded-md border text-sm font-medium capitalize transition-colors
								{type === t ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground hover:border-muted-foreground'}"
						>
							{t}
						</button>
					{/each}
				</div>
			</div>


			<!-- Line Items -->
			<div>
				<label class="text-sm font-medium block mb-1.5">Line Items <span class="text-destructive">*</span></label>
				<LineItemsEditor bind:items />
			</div>
			<!-- Date -->
			<div>
				<label class="text-sm font-medium block mb-1.5" for="tx-date">Date <span class="text-destructive">*</span></label>
				<input
					id="tx-date"
					type="date"
					bind:value={transactionDate}
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>

			<!-- Classification: Location / Channel / Category / Contact -->
			<div class="grid grid-cols-2 gap-3">
				<div class="{type === 'transfer' ? 'col-span-2' : ''}">
					<label class="text-sm font-medium block mb-1.5" for="tx-location">Location <span class="text-destructive">*</span></label>
					<select
						id="tx-location"
						bind:value={locationId}
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					>
						<option value="">Select location</option>
						{#each locations as loc (loc.id)}
							<option value={loc.id}>{loc.name}</option>
						{/each}
					</select>
				</div>
				{#if type !== 'transfer'}
					<div>
						<label class="text-sm font-medium block mb-1.5" for="tx-channel">
							Sales Channel {#if type === 'income'}<span class="text-destructive">*</span>{/if}
						</label>
						<select
							id="tx-channel"
							bind:value={salesChannelId}
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						>
							<option value="">Select channel</option>
							{#each channels as ch (ch.id)}
								<option value={ch.id}>{ch.name}</option>
							{/each}
						</select>
					</div>
				{/if}
				<div class="{type === 'transfer' ? 'col-span-2' : ''}">
					<label class="text-sm font-medium block mb-1.5" for="tx-category">Category</label>
					<select
						id="tx-category"
						bind:value={categoryId}
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					>
						<option value="">No category</option>
						{#each filteredCategories as cat (cat.id)}
							<option value={cat.id}>{cat.name}</option>
						{/each}
					</select>
				</div>
				{#if type === 'income' || type === 'expense'}
					<div>
						<label class="text-sm font-medium block mb-1.5" for="tx-contact">
							{type === 'income' ? 'Client' : 'Supplier'}
						</label>
						<select
							id="tx-contact"
							bind:value={contactId}
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						>
							<option value="">No {type === 'income' ? 'client' : 'supplier'}</option>
							{#each (type === 'income' ? clientContacts : supplierContacts) as c (c.id)}
								<option value={c.id}>{c.name}</option>
							{/each}
						</select>
					</div>
				{/if}
			</div>

			<!-- Note + Reference + Invoice -->
			<div class="grid grid-cols-2 gap-3">
				<div class="col-span-2">
					<label class="text-sm font-medium block mb-1.5" for="tx-note">Note</label>
					<input
						id="tx-note"
						type="text"
						bind:value={note}
						placeholder="Optional note"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>
				<div>
					<label class="text-sm font-medium block mb-1.5" for="tx-ref">Reference No.</label>
					<input
						id="tx-ref"
						type="text"
						bind:value={referenceNo}
						placeholder="Optional"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>
				<div>
					<label class="text-sm font-medium block mb-1.5" for="tx-invoice-no">Invoice No.</label>
					<input
						id="tx-invoice-no"
						type="text"
						bind:value={invoiceNo}
						placeholder="e.g. INV-0001"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-2">
				<a
					href="/businesses/{businessId}/transactions"
					class="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted"
				>
					Cancel
				</a>
				<button
					onclick={submit}
					disabled={submitting || !locationId || !transactionDate}
					class="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
				>
					{#if submitting}<Loader2 class="size-4 animate-spin" />{/if}
					Save Changes
				</button>
			</div>
		</div>
		<!-- ─── Attachments ─────────────────────────────────────────────── -->
		<div class="mt-8 pt-6 border-t border-border">
			<div class="flex items-center justify-between mb-3">
				<div class="flex items-center gap-2">
					<Paperclip class="size-4 text-muted-foreground" />
					<span class="text-sm font-medium text-foreground">Attachments</span>
					{#if attachmentsList.length > 0}
						<span class="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
							{attachmentsList.length}
						</span>
					{/if}
				</div>
				<label class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-sm font-medium cursor-pointer transition-colors">
					{#if uploadingFile}
						<Loader2 class="size-3.5 animate-spin" />
						Uploading…
					{:else}
						<Paperclip class="size-3.5" />
						Attach file
					{/if}
					<input
						bind:this={fileInput}
						type="file"
						accept="image/jpeg,image/png,application/pdf"
						class="sr-only"
						disabled={uploadingFile}
						onchange={uploadFile}
					/>
				</label>
			</div>

			{#if uploadError}
				<p class="text-destructive text-xs mb-3">{uploadError}</p>
			{/if}

			{#if attachmentsList.length === 0}
				<p class="text-sm text-muted-foreground py-4 text-center">No attachments yet. Attach a receipt or invoice.</p>
			{:else}
				<div class="rounded-lg border border-border overflow-hidden">
					{#each attachmentsList as att (att.id)}
						<div class="flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-0 bg-card">
							{#if att.mimeType === 'application/pdf'}
								<FileText class="size-4 text-red-500 shrink-0" />
							{:else if att.mimeType.startsWith('image/')}
								<img
									src={downloadUrl(att.id)}
									alt={att.fileName}
									class="h-10 w-10 rounded object-cover border border-border shrink-0"
								/>
							{:else}
								<FileImage class="size-4 text-blue-500 shrink-0" />
							{/if}
							<div class="flex-1 min-w-0">
								<p class="text-sm text-foreground truncate">{att.fileName}</p>
								<p class="text-xs text-muted-foreground">{formatFileSize(att.fileSize)}</p>
							</div>
							{#if isImageMime(att.mimeType)}
								<button
									type="button"
									onclick={() => toggleFeatured(att)}
									class="p-1.5 rounded transition-colors shrink-0 {featuredImageId === att.id ? 'text-yellow-500 hover:text-yellow-600' : 'text-muted-foreground hover:text-yellow-500 hover:bg-yellow-50'}"
									title={featuredImageId === att.id ? 'Remove from invoice' : 'Feature on invoice'}
								>
									<Star class="size-3.5 {featuredImageId === att.id ? 'fill-current' : ''}" />
								</button>
							{/if}
							<a
								href={downloadUrl(att.id)}
								target="_blank"
								rel="noopener noreferrer"
								class="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
								title="Download"
							>
								<Download class="size-3.5" />
							</a>
							<button
								onclick={() => deleteAttachment(att.id)}
								disabled={deletingAttachmentId === att.id}
								class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 disabled:opacity-50"
								title="Delete"
							>
								{#if deletingAttachmentId === att.id}
									<Loader2 class="size-3.5 animate-spin" />
								{:else}
									<Trash2 class="size-3.5" />
								{/if}
							</button>
						</div>
					{/each}
				</div>
				{#if attachmentsList.some((a) => isImageMime(a.mimeType))}
					<p class="text-xs text-muted-foreground mt-2">
						<Star class="size-3 inline-block mr-0.5" /> Star an image to feature it on the invoice.
					</p>
				{/if}
			{/if}
			<p class="text-xs text-muted-foreground mt-2">JPEG, PNG or PDF · max 10 MB per file · up to 10 files</p>
		</div>
	{/if}
</div>

<!-- Delete confirmation modal -->
{#if showDeleteConfirm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
		<div class="bg-card rounded-lg border border-border p-6 max-w-sm w-full shadow-lg">
			<h3 class="font-semibold text-foreground mb-2">Delete Transaction?</h3>
			<p class="text-sm text-muted-foreground mb-5">This action cannot be undone.</p>
			<div class="flex justify-end gap-2">
				<button
					onclick={() => (showDeleteConfirm = false)}
					class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
				>
					Cancel
				</button>
				<button
					onclick={deleteTransaction}
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
