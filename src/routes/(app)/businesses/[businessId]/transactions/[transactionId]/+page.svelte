<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api } from '$lib/client/api.svelte';
	import { ArrowLeft, Loader2, Paperclip, Trash2, Download, FileImage, FileText, Star, Printer, Mail, Crown } from '@lucide/svelte';
	import LineItemsEditor from '$lib/components/LineItemsEditor.svelte';
	import ServicesEditor from '$lib/components/ServicesEditor.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { PLAN_KEY } from '$lib/configurations/plans';

	type Location = { id: string; name: string; type: string };
	type Channel = { id: string; name: string; type: string };
	type Category = { id: string; name: string; type: string };
	type Contact  = { id: string; name: string; isClient: boolean; isSupplier: boolean };
	type Transaction = {
		id: string;
		type: 'income' | 'expense';
		lineItemMode: 'items' | 'services';
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
	type Product = { id: string; name: string; sku: string | null; description: string | null; defaultPrice: number; defaultQty: number };
	type ItemAttachment = { id: string; fileName: string; mimeType: string };
	type LineItem = { description: string; quantity: number; unitPrice: string; attachments: ItemAttachment[]; productId: string };
	type ServiceItem = { description: string; hours: number; rate: string; attachments: ItemAttachment[] };

	const businessId = $page.params.businessId!;
	const transactionId = $page.params.transactionId!;
	const canUploadAttachment = $derived(
		($page.data.navBusinesses as { id: string; planKey: string }[])
			?.find((b) => b.id === businessId)?.planKey === PLAN_KEY.PRO
	);
	const canEmail = $derived(
		($page.data.navBusinesses as { id: string; planKey: string }[])
			?.find((b) => b.id === businessId)?.planKey === PLAN_KEY.PRO
	);

	let locations = $state<Location[]>([]);
	let channels = $state<Channel[]>([]);
	let categories = $state<Category[]>([]);
	let contacts = $state<Contact[]>([]);
	let products = $state<Product[]>([]);
	let loadingMeta = $state(true);

	// Form fields
	let type = $state<'income' | 'expense'>('income');
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

	let filteredCategories  = $derived(categories.filter((c) => c.type === type));
	let clientContacts   = $derived(contacts.filter((c) => c.isClient));
	let supplierContacts = $derived(contacts.filter((c) => c.isSupplier));

	// Attachments
	let attachmentsList = $state<Attachment[]>([]);
	let uploadingFile = $state(false);
	let uploadError = $state<string | null>(null);
	let deletingAttachmentId = $state<string | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	const MAX_FILE_SIZE = 10 * 1024 * 1024;

	// Line items / services
	let lineItemMode = $state<'items' | 'services'>('items');
	let items = $state<LineItem[]>([]);
	let serviceItems = $state<ServiceItem[]>([]);

	function switchMode(m: 'items' | 'services') {
		if (m === lineItemMode) return;
		lineItemMode = m;
		if (m === 'items') serviceItems = [];
		else items = [];
	}

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
			const [locs, chans, cats, conts, prods, tx, atts] = await Promise.all([
				api.get<Location[]>(`/businesses/${businessId}/locations`),
				api.get<Channel[]>(`/businesses/${businessId}/channels`),
				api.get<Category[]>(`/businesses/${businessId}/categories`),
				api.get<Contact[]>(`/businesses/${businessId}/contacts`),
				api.get<Product[]>(`/businesses/${businessId}/products`),
				api.get<Transaction>(`/businesses/${businessId}/transactions/${transactionId}`),
				api.get<Attachment[]>(`/businesses/${businessId}/transactions/${transactionId}/attachments`),
			]);
			locations = locs;
			channels = chans;
			categories = cats;
			contacts = conts;
			products = prods;
			attachmentsList = atts;

			type = tx.type;
			lineItemMode = tx.lineItemMode ?? 'items';
			transactionDate = tx.transactionDate;
			locationId = tx.locationId;
			salesChannelId = tx.salesChannelId ?? '';
			categoryId = tx.categoryId ?? '';
			contactId = tx.contactId ?? '';
			note = tx.note ?? '';
			referenceNo = tx.referenceNo ?? '';
			invoiceNo = tx.invoiceNo ?? '';
			featuredImageId = tx.featuredImageId ?? null;

			if (lineItemMode === 'items') {
				const txItems = await api.get<{ id: string; description: string; quantity: number; unitPrice: number; sortOrder: number; productId: string; attachments: ItemAttachment[] }[]>(
					`/businesses/${businessId}/transactions/${transactionId}/items`
				);
				items = txItems.map((i) => ({
					description: i.description,
					quantity: i.quantity,
					unitPrice: (i.unitPrice / 100).toFixed(2),
					attachments: i.attachments ?? [],
					productId: i.productId
				}));
			} else {
				const txServiceItems = await api.get<{ id: string; description: string; hours: number; rate: number; sortOrder: number; attachments: ItemAttachment[] }[]>(
					`/businesses/${businessId}/transactions/${transactionId}/service-items`
				);
				serviceItems = txServiceItems.map((i) => ({
					description: i.description,
					hours: i.hours,
					rate: (i.rate / 100).toFixed(2),
					attachments: i.attachments ?? []
				}));
			}
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
		const hasItems = lineItemMode === 'items' ? items.length > 0 : serviceItems.length > 0;
		if (!hasItems) {
			submitError = lineItemMode === 'items' ? 'Add at least one line item.' : 'Add at least one service.';
			return;
		}

		try {
			submitting = true;
			submitError = null;
			const total = lineItemMode === 'items'
				? items.reduce((sum, i) => sum + Math.round(parseFloat(i.unitPrice || '0') * 100) * i.quantity, 0)
				: serviceItems.reduce((sum, i) => sum + Math.round(i.hours * Math.round(parseFloat(i.rate || '0') * 100)), 0);
			await api.patch(`/businesses/${businessId}/transactions/${transactionId}`, {
				type,
				lineItemMode,
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
			if (lineItemMode === 'items') {
				await api.put(`/businesses/${businessId}/transactions/${transactionId}/items`,
					items.map((item, idx) => ({
						description: item.description,
						quantity: item.quantity,
						unitPrice:     Math.round(parseFloat(item.unitPrice) * 100) || 0,
						sortOrder:     idx,
						attachmentIds: item.attachments.map((a) => a.id),
						productId:     item.productId,
					}))
				);
			} else {
				await api.put(`/businesses/${businessId}/transactions/${transactionId}/service-items`,
					serviceItems.map((item, idx) => ({
						description: item.description,
						hours: item.hours,
						rate:          Math.round(parseFloat(item.rate) * 100) || 0,
						sortOrder:     idx,
						attachmentIds: item.attachments.map((a) => a.id)
					}))
				);
			}
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

	async function createProductInline(name: string, defaultPrice: number): Promise<Product> {
		const p = await api.post<Product>(`/businesses/${businessId}/products`, {
			name, defaultPrice
		});
		products = [...products, p];
		return p;
	}

	onMount(loadMeta);
</script>

<div>
	<!-- Header -->
	<div class="flex items-center justify-between mb-5">
		<Button href="/businesses/{businessId}/transactions" variant="ghost" size="sm" class="-ml-2 gap-1.5 text-muted-foreground">
			<ArrowLeft class="size-3.5" /> Back
		</Button>
		{#if !loadingMeta && !loadError}
			<div class="flex items-center gap-2">
				{#if canEmail}
				<Button href="/businesses/{businessId}/transactions/{transactionId}/email" variant="outline" size="sm">
					<Mail class="size-3.5" /> Email
				</Button>
				{:else}
					<Button variant="outline" size="sm" disabled class="gap-1.5 opacity-60">
						<Mail class="size-3.5" /> Email
						<Crown class="size-3 text-amber-500" />
					</Button>
				{/if}
				<Button href="/businesses/{businessId}/transactions/{transactionId}/print" variant="outline" size="sm">
					<Printer class="size-3.5" /> PDF
				</Button>
				<Button
					variant="outline"
					size="sm"
					onclick={() => (showDeleteConfirm = true)}
					class="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
				>
					<Trash2 class="size-3.5" /> Delete
				</Button>
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

		<!-- Two-column on desktop: Transaction left, Classification+Details right -->
		<div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">

			<!-- Card: Transaction (left / full-width on mobile) -->
			<Card.Root>
				<Card.Header class="pb-3">
					<Card.Title class="text-base">Transaction</Card.Title>
				</Card.Header>
				<Card.Content class="flex flex-col gap-4">
					<!-- Type -->
					<div class="space-y-1.5">
						<Label>Type <span class="text-destructive">*</span></Label>
						<div class="flex gap-2">
							{#each ['income', 'expense'] as t}
								<Button
									variant={type === t ? 'default' : 'outline'}
									class="flex-1 capitalize"
									onclick={() => { type = t as typeof type; salesChannelId = ''; categoryId = ''; contactId = ''; }}
								>
									{t}
								</Button>
							{/each}
						</div>
					</div>

					<!-- Mode toggle -->
					<div class="space-y-1.5">
						<Label>Mode</Label>
						<div class="flex gap-2">
							{#each [['items', 'Line Items'], ['services', 'Services']] as [m, label]}
								<Button
									variant={lineItemMode === m ? 'default' : 'outline'}
									class="flex-1"
									onclick={() => switchMode(m as 'items' | 'services')}
								>
									{label}
								</Button>
							{/each}
						</div>
					</div>

					<!-- Line Items / Services -->
					<div class="space-y-1.5">
						<Label>
							{lineItemMode === 'items' ? 'Line Items' : 'Services'} <span class="text-destructive">*</span>
						</Label>
						{#if lineItemMode === 'items'}
							<LineItemsEditor bind:items {businessId} {canUploadAttachment} {products} onCreateProduct={createProductInline} />
						{:else}
							<ServicesEditor bind:items={serviceItems} {businessId} {canUploadAttachment} />
						{/if}
					</div>

					<!-- Date -->
					<div class="space-y-1.5">
						<Label for="tx-date">Date <span class="text-destructive">*</span></Label>
						<Input id="tx-date" type="date" bind:value={transactionDate} />
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Right column: Classification + Details -->
			<div class="flex flex-col gap-4">

				<!-- Card: Classification -->
				<Card.Root>
					<Card.Header class="pb-3">
						<Card.Title class="text-base">Classification</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="grid grid-cols-2 gap-3">
							<!-- Location -->
							<div class="space-y-1.5">
								<Label>Location <span class="text-destructive">*</span></Label>
								<Select.Root type="single" bind:value={locationId}>
									<Select.Trigger class="w-full">
										{locationId ? locations.find((l) => l.id === locationId)?.name : 'Select location'}
									</Select.Trigger>
									<Select.Content>
										{#each locations as loc (loc.id)}
											<Select.Item value={loc.id}>{loc.name}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>

							<!-- Sales Channel -->
								<div class="space-y-1.5">
									<Label>
										Sales Channel {#if type === 'income'}<span class="text-destructive">*</span>{/if}
									</Label>
									<Select.Root type="single" bind:value={salesChannelId}>
										<Select.Trigger class="w-full">
											{salesChannelId ? channels.find((c) => c.id === salesChannelId)?.name : 'Select channel'}
										</Select.Trigger>
										<Select.Content>
											{#each channels as ch (ch.id)}
												<Select.Item value={ch.id}>{ch.name}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>

							<!-- Category -->
							<div class="space-y-1.5">
								<Label>Category</Label>
								<Select.Root type="single" bind:value={categoryId}>
									<Select.Trigger class="w-full">
										{categoryId ? filteredCategories.find((c) => c.id === categoryId)?.name : 'No category'}
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="">No category</Select.Item>
										{#each filteredCategories as cat (cat.id)}
											<Select.Item value={cat.id}>{cat.name}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>

							<!-- Contact -->
							{#if type === 'income'}
								<div class="space-y-1.5">
									<Label>Client</Label>
									<Select.Root type="single" bind:value={contactId}>
										<Select.Trigger class="w-full">
											{contactId ? clientContacts.find((c) => c.id === contactId)?.name : 'No client'}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="">No client</Select.Item>
											{#each clientContacts as c (c.id)}
												<Select.Item value={c.id}>{c.name}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
							{:else if type === 'expense'}
								<div class="space-y-1.5">
									<Label>Supplier</Label>
									<Select.Root type="single" bind:value={contactId}>
										<Select.Trigger class="w-full">
											{contactId ? supplierContacts.find((c) => c.id === contactId)?.name : 'No supplier'}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="">No supplier</Select.Item>
											{#each supplierContacts as c (c.id)}
												<Select.Item value={c.id}>{c.name}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>

				<!-- Card: Details -->
				<Card.Root>
					<Card.Header class="pb-3">
						<Card.Title class="text-base">Details</Card.Title>
					</Card.Header>
					<Card.Content class="flex flex-col gap-4">
						<div class="space-y-1.5">
							<Label for="tx-note">Note</Label>
							<Input id="tx-note" type="text" bind:value={note} placeholder="Optional note" />
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="space-y-1.5">
								<Label for="tx-ref">Reference No.</Label>
								<Input id="tx-ref" type="text" bind:value={referenceNo} placeholder="Optional" />
							</div>
							<div class="space-y-1.5">
								<Label for="tx-invoice-no">Invoice No.</Label>
								<Input id="tx-invoice-no" type="text" bind:value={invoiceNo} placeholder="e.g. INV-0001" />
							</div>
						</div>
					</Card.Content>
				</Card.Root>

			</div><!-- end right column -->
		</div><!-- end grid -->

		<!-- Actions -->
		<div class="flex justify-end gap-2 mt-4">
			<Button href="/businesses/{businessId}/transactions" variant="ghost">Cancel</Button>
			<Button onclick={submit} disabled={submitting || !locationId || !transactionDate}>
				{#if submitting}<Loader2 class="size-4 animate-spin" />{/if}
				Save Changes
			</Button>
		</div>

		<!-- Card: Attachments -->
		<Card.Root class="mt-4">
			<Card.Header class="pb-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Paperclip class="size-4 text-muted-foreground" />
						<Card.Title class="text-base">Attachments</Card.Title>
						{#if attachmentsList.length > 0}
							<span class="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
								{attachmentsList.length}
							</span>
						{/if}
					</div>
					{#if canUploadAttachment}
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
					{/if}
				</div>
			</Card.Header>
			<Card.Content>
				{#if canUploadAttachment && uploadError}
					<p class="text-destructive text-xs mb-3">{uploadError}</p>
				{/if}

				{#if !canUploadAttachment && attachmentsList.length === 0}
					<div class="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 text-sm">
						<Crown class="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
						<span class="text-amber-700 dark:text-amber-300">
							File attachments are available on the <a href="/organizations" class="underline font-medium">Pro plan</a>.
						</span>
					</div>
				{:else if attachmentsList.length === 0}
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
								{#if canUploadAttachment}
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
								{/if}
							</div>
						{/each}
					</div>
					{#if attachmentsList.some((a) => isImageMime(a.mimeType))}
						<p class="text-xs text-muted-foreground mt-2">
							<Star class="size-3 inline-block mr-0.5" /> Star an image to feature it on the invoice.
						</p>
					{/if}
				{/if}
				{#if canUploadAttachment}
				<p class="text-xs text-muted-foreground mt-2">JPEG, PNG or PDF · max 10 MB per file · up to 10 files</p>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</div>

<!-- Delete confirmation -->
<AlertDialog.Root bind:open={showDeleteConfirm}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Transaction?</AlertDialog.Title>
			<AlertDialog.Description>This action cannot be undone.</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={deleteTransaction}
				disabled={deleting}
				class="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50"
			>
				{#if deleting}<Loader2 class="size-4 animate-spin mr-1" />{/if}Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
