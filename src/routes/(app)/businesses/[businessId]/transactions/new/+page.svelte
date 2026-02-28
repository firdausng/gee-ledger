<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api } from '$lib/client/api.svelte';
	import { CHANNEL_TYPES, channelMeta, type ChannelType } from '$lib/client/channelMeta';
	import { ArrowLeft, Loader2, Paperclip, X, FileText, Plus } from '@lucide/svelte';
	import LineItemsEditor from '$lib/components/LineItemsEditor.svelte';
	import ServicesEditor from '$lib/components/ServicesEditor.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';

	type Location = { id: string; name: string; type: string };
	type Channel = { id: string; name: string; type: string };
	type Category = { id: string; name: string; type: string };
	type Contact = { id: string; name: string; isClient: boolean; isSupplier: boolean };
	type PendingAttachment = { id: string; fileName: string; mimeType: string; fileSize: number };
	type ItemAttachment = { id: string; fileName: string; mimeType: string };
	type LineItem = { description: string; quantity: number; unitPrice: string; attachments: ItemAttachment[] };
	type ServiceItem = { description: string; hours: number; rate: string; attachments: ItemAttachment[] };

	const businessId = $page.params.businessId;

	let locations = $state<Location[]>([]);
	let channels = $state<Channel[]>([]);
	let categories = $state<Category[]>([]);
	let contacts = $state<Contact[]>([]);
	let loadingMeta = $state(true);

	// Form fields
	let type = $state<'income' | 'expense'>('income');
	let transactionDate = $state(new Date().toISOString().slice(0, 10));
	let locationId = $state('');
	let salesChannelId = $state('');
	let categoryId = $state('');
	let contactId = $state('');
	let note = $state('');
	let referenceNo = $state('');

	let submitting = $state(false);
	let submitError = $state<string | null>(null);

	// Attachments — uploaded immediately, linked on save
	let pendingAttachments = $state<PendingAttachment[]>([]);
	let uploadingFile = $state(false);
	let uploadError = $state<string | null>(null);

	const MAX_FILE_SIZE = 10 * 1024 * 1024;

	let filteredCategories = $derived(categories.filter((c) => c.type === type));
	let clientContacts   = $derived(contacts.filter((c) => c.isClient));
	let supplierContacts = $derived(contacts.filter((c) => c.isSupplier));

	// Line items mode
	let lineItemMode = $state<'items' | 'services'>('items');
	let items = $state<LineItem[]>([]);
	let serviceItems = $state<ServiceItem[]>([]);

	function switchMode(m: 'items' | 'services') {
		if (m === lineItemMode) return;
		lineItemMode = m;
		// Reset the other mode's data when switching
		if (m === 'items') serviceItems = [];
		else items = [];
	}

	let itemsTotal = $derived(
		lineItemMode === 'items'
			? items.reduce((sum, i) =>
					sum + Math.round(parseFloat(i.unitPrice || '0') * 100) * i.quantity, 0)
			: serviceItems.reduce((sum, i) =>
					sum + Math.round(i.hours * Math.round(parseFloat(i.rate || '0') * 100)), 0)
	);

	// ── Location modal ────────────────────────────────────────────────
	let showLocationModal = $state(false);
	let newLocName = $state('');
	let newLocType = $state<'hq' | 'branch' | 'warehouse' | 'online'>('branch');
	let newLocAddress = $state('');
	let savingLocation = $state(false);
	let locationError = $state<string | null>(null);

	function openLocationModal() {
		newLocName = '';
		newLocType = 'branch';
		newLocAddress = '';
		locationError = null;
		showLocationModal = true;
	}

	async function saveLocation() {
		if (!newLocName.trim()) return;
		try {
			savingLocation = true;
			locationError = null;
			const loc = await api.post<Location>(`/businesses/${businessId}/locations`, {
				name: newLocName.trim(),
				type: newLocType,
				address: newLocAddress.trim() || undefined
			});
			locations = [...locations, loc];
			locationId = loc.id;
			showLocationModal = false;
		} catch (e) {
			locationError = e instanceof Error ? e.message : 'Failed to create location.';
		} finally {
			savingLocation = false;
		}
	}

	// ── Category modal ────────────────────────────────────────────────
	let showCategoryModal = $state(false);
	let newCatName = $state('');
	let newCatType = $derived<'income' | 'expense'>(type === 'expense' ? 'expense' : 'income');
	let savingCategory = $state(false);
	let categoryError = $state<string | null>(null);

	function openCategoryModal() {
		newCatName = '';
		categoryError = null;
		showCategoryModal = true;
	}

	async function saveCategory() {
		if (!newCatName.trim()) return;
		try {
			savingCategory = true;
			categoryError = null;
			const cat = await api.post<Category>(`/businesses/${businessId}/categories`, {
				name: newCatName.trim(),
				type: newCatType
			});
			categories = [...categories, cat];
			categoryId = cat.id;
			showCategoryModal = false;
		} catch (e) {
			categoryError = e instanceof Error ? e.message : 'Failed to create category.';
		} finally {
			savingCategory = false;
		}
	}

	// ── Contact modal ─────────────────────────────────────────────────
	let showContactModal = $state(false);
	let newContactName = $state('');
	let newContactIsClient   = $state(false);
	let newContactIsSupplier = $state(false);
	let savingContact = $state(false);
	let contactError = $state<string | null>(null);

	function openContactModal() {
		newContactName = '';
		newContactIsClient   = type === 'income';
		newContactIsSupplier = type === 'expense';
		contactError = null;
		showContactModal = true;
	}

	async function saveContact() {
		if (!newContactName.trim()) return;
		try {
			savingContact = true;
			contactError = null;
			const c = await api.post<Contact>(`/businesses/${businessId}/contacts`, {
				name:       newContactName.trim(),
				isClient:   newContactIsClient,
				isSupplier: newContactIsSupplier,
			});
			contacts = [...contacts, c];
			contactId = c.id;
			showContactModal = false;
		} catch (e) {
			contactError = e instanceof Error ? e.message : 'Failed to create contact.';
		} finally {
			savingContact = false;
		}
	}

	// ── Channel modal ─────────────────────────────────────────────────
	let showChannelModal = $state(false);
	let newChName = $state('');
	let newChType = $state<ChannelType>('walk_in');
	let savingChannel = $state(false);
	let channelError = $state<string | null>(null);

	function openChannelModal() {
		newChName = '';
		newChType = 'walk_in';
		channelError = null;
		showChannelModal = true;
	}

	async function saveChannel() {
		if (!newChName.trim()) return;
		try {
			savingChannel = true;
			channelError = null;
			const ch = await api.post<Channel>(`/businesses/${businessId}/channels`, {
				name: newChName.trim(),
				type: newChType
			});
			channels = [...channels, ch];
			salesChannelId = ch.id;
			showChannelModal = false;
		} catch (e) {
			channelError = e instanceof Error ? e.message : 'Failed to create channel.';
		} finally {
			savingChannel = false;
		}
	}

	// ─────────────────────────────────────────────────────────────────

	function formatFileSize(bytes: number): string {
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	async function loadMeta() {
		try {
			loadingMeta = true;
			const [locs, chans, cats, ctcts] = await Promise.all([
				api.get<Location[]>(`/businesses/${businessId}/locations`),
				api.get<Channel[]>(`/businesses/${businessId}/channels`),
				api.get<Category[]>(`/businesses/${businessId}/categories`),
				api.get<Contact[]>(`/businesses/${businessId}/contacts`)
			]);
			locations = locs;
			channels = chans;
			categories = cats;
			contacts = ctcts;
			if (locs.length > 0) locationId = locs[0].id;
		} catch {
			// non-critical
		} finally {
			loadingMeta = false;
		}
	}

	async function onFileChange(event: Event) {
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
			const result = await api.upload<PendingAttachment>(
				`/businesses/${businessId}/attachments`,
				form
			);
			pendingAttachments = [...pendingAttachments, result];
		} catch (e) {
			uploadError = e instanceof Error ? e.message : 'Upload failed.';
		} finally {
			uploadingFile = false;
			input.value = '';
		}
	}

	function removePending(id: string) {
		pendingAttachments = pendingAttachments.filter((a) => a.id !== id);
	}

	async function submit() {
		if (!locationId || !transactionDate) return;
		if (type === 'income' && !salesChannelId) {
			submitError = 'Sales channel is required for income transactions.';
			return;
		}
		if (itemsTotal <= 0) {
			submitError = 'Add at least one item with a price greater than zero.';
			return;
		}

		try {
			submitting = true;
			submitError = null;
			const tx = await api.post<{ id: string }>(`/businesses/${businessId}/transactions`, {
				type,
				lineItemMode,
				transactionDate,
				amount: itemsTotal,
				locationId,
				salesChannelId: salesChannelId || undefined,
				categoryId: categoryId || undefined,
				contactId: contactId || undefined,
				note: note.trim() || undefined,
				referenceNo: referenceNo.trim() || undefined,
				attachmentIds: pendingAttachments.map((a) => a.id)
			});
			if (lineItemMode === 'items') {
				await api.put(`/businesses/${businessId}/transactions/${tx.id}/items`,
					items.map((i, idx) => ({
						description:   i.description,
						quantity:      i.quantity,
						unitPrice:     Math.round(parseFloat(i.unitPrice) * 100),
						sortOrder:     idx,
						attachmentIds: i.attachments.map((a) => a.id),
					}))
				);
			} else {
				await api.put(`/businesses/${businessId}/transactions/${tx.id}/service-items`,
					serviceItems.map((i, idx) => ({
						description:   i.description,
						hours:         i.hours,
						rate:          Math.round(parseFloat(i.rate) * 100),
						sortOrder:     idx,
						attachmentIds: i.attachments.map((a) => a.id),
					}))
				);
			}
			goto(`/businesses/${businessId}/transactions`);
		} catch (e) {
			submitError = e instanceof Error ? e.message : 'Failed to create transaction';
		} finally {
			submitting = false;
		}
	}

	onMount(loadMeta);
</script>

<div>
	<a
		href="/businesses/{businessId}/transactions"
		class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
	>
		<ArrowLeft class="size-3.5" />
		Back to Transactions
	</a>

	<h2 class="text-lg font-semibold text-foreground mb-5">New Transaction</h2>

	{#if submitError}
		<div class="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{submitError}</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">

		<!-- Card: Transaction (left) -->
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
								onclick={() => { type = t as typeof type; salesChannelId = ''; categoryId = ''; }}
							>
								{t}
							</Button>
						{/each}
					</div>
				</div>

				<!-- Mode -->
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
						<LineItemsEditor bind:items {businessId} />
					{:else}
						<ServicesEditor bind:items={serviceItems} {businessId} />
					{/if}
				</div>

				<!-- Date -->
				<div class="space-y-1.5">
					<Label for="tx-date">Date <span class="text-destructive">*</span></Label>
					<Input id="tx-date" type="date" bind:value={transactionDate} />
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Right column -->
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
							{#if loadingMeta}
								<div class="h-9 rounded-md border border-input bg-muted animate-pulse"></div>
							{:else if locations.length === 0}
								<button
									type="button"
									onclick={openLocationModal}
									class="w-full flex items-center justify-center gap-1 h-9 rounded-md border border-dashed border-input text-sm text-primary hover:bg-muted transition-colors"
								>
									<Plus class="size-3.5" /> Add location
								</button>
							{:else}
								<div class="flex gap-1.5">
									<Select.Root type="single" bind:value={locationId}>
										<Select.Trigger class="flex-1 min-w-0">
											{locationId ? locations.find((l) => l.id === locationId)?.name : 'Select location'}
										</Select.Trigger>
										<Select.Content>
											{#each locations as loc (loc.id)}
												<Select.Item value={loc.id}>{loc.name}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
									<button
										type="button"
										onclick={openLocationModal}
										class="px-2 rounded-md border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
										title="Add new location"
									><Plus class="size-4" /></button>
								</div>
							{/if}
						</div>

						<!-- Sales Channel -->
						<div class="space-y-1.5">
							<Label>Sales Channel {#if type === 'income'}<span class="text-destructive">*</span>{/if}</Label>
							{#if !loadingMeta && channels.length === 0}
								<button
									type="button"
									onclick={openChannelModal}
									class="w-full flex items-center justify-center gap-1 h-9 rounded-md border border-dashed border-input text-sm text-primary hover:bg-muted transition-colors"
								>
									<Plus class="size-3.5" /> Add channel
								</button>
							{:else}
								<div class="flex gap-1.5">
									<Select.Root type="single" bind:value={salesChannelId}>
										<Select.Trigger class="flex-1 min-w-0">
											{salesChannelId ? channels.find((c) => c.id === salesChannelId)?.name : 'Select channel'}
										</Select.Trigger>
										<Select.Content>
											{#each channels as ch (ch.id)}
												<Select.Item value={ch.id}>{ch.name}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
									<button
										type="button"
										onclick={openChannelModal}
										class="px-2 rounded-md border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
										title="Add new channel"
									><Plus class="size-4" /></button>
								</div>
							{/if}
						</div>

						<!-- Category -->
						<div class="space-y-1.5">
							<Label>Category</Label>
							{#if !loadingMeta && filteredCategories.length === 0}
								<button
									type="button"
									onclick={openCategoryModal}
									class="w-full flex items-center justify-center gap-1 h-9 rounded-md border border-dashed border-input text-sm text-primary hover:bg-muted transition-colors"
								>
									<Plus class="size-3.5" /> Add category
								</button>
							{:else}
								<div class="flex gap-1.5">
									<Select.Root type="single" bind:value={categoryId}>
										<Select.Trigger class="flex-1 min-w-0">
											{categoryId ? filteredCategories.find((c) => c.id === categoryId)?.name : 'No category'}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="">No category</Select.Item>
											{#each filteredCategories as cat (cat.id)}
												<Select.Item value={cat.id}>{cat.name}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
									<button
										type="button"
										onclick={openCategoryModal}
										class="px-2 rounded-md border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
										title="Add new category"
									><Plus class="size-4" /></button>
								</div>
							{/if}
						</div>

						<!-- Contact -->
						<div class="space-y-1.5">
							<Label>{type === 'income' ? 'Client' : 'Supplier'}</Label>
							<div class="flex gap-1.5">
								<Select.Root type="single" bind:value={contactId}>
									<Select.Trigger class="flex-1 min-w-0">
										{#if contactId}
											{(type === 'income' ? clientContacts : supplierContacts).find((c) => c.id === contactId)?.name}
										{:else}
											No {type === 'income' ? 'client' : 'supplier'}
										{/if}
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="">No {type === 'income' ? 'client' : 'supplier'}</Select.Item>
										{#each (type === 'income' ? clientContacts : supplierContacts) as c (c.id)}
											<Select.Item value={c.id}>{c.name}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
								<button
									type="button"
									onclick={openContactModal}
									class="px-2 rounded-md border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
									title="Add new contact"
								><Plus class="size-4" /></button>
							</div>
						</div>

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
					<div class="space-y-1.5">
						<Label for="tx-ref">Reference No.</Label>
						<Input id="tx-ref" type="text" bind:value={referenceNo} placeholder="Optional" />
					</div>
				</Card.Content>
			</Card.Root>

		</div><!-- end right column -->
	</div><!-- end grid -->

	<!-- Actions -->
	<div class="flex justify-end gap-2 mt-4">
		<Button href="/businesses/{businessId}/transactions" variant="ghost">Cancel</Button>
		<Button
			onclick={submit}
			disabled={submitting || !locationId || itemsTotal <= 0 || !transactionDate || uploadingFile}
		>
			{#if submitting}<Loader2 class="size-4 animate-spin" />{/if}
			Save Transaction
		</Button>
	</div>

	<!-- Card: Attachments -->
	<Card.Root class="mt-4">
		<Card.Header class="pb-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Paperclip class="size-4 text-muted-foreground" />
					<Card.Title class="text-base">Attachments</Card.Title>
					{#if pendingAttachments.length > 0}
						<span class="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
							{pendingAttachments.length}
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
						type="file"
						accept="image/jpeg,image/png,application/pdf"
						class="sr-only"
						disabled={uploadingFile}
						onchange={onFileChange}
					/>
				</label>
			</div>
		</Card.Header>
		<Card.Content>
			{#if uploadError}
				<p class="text-destructive text-xs mb-3">{uploadError}</p>
			{/if}
			{#if pendingAttachments.length === 0}
				<p class="text-sm text-muted-foreground py-4 text-center">No attachments yet. Attach a receipt or invoice.</p>
			{:else}
				<div class="flex flex-col gap-2">
					{#each pendingAttachments as att (att.id)}
						<div class="rounded-md border border-border bg-card overflow-hidden">
							{#if att.mimeType.startsWith('image/')}
								<img
									src={"/api/businesses/" + businessId + "/attachments/" + att.id + "/download"}
									alt={att.fileName}
									class="w-full h-36 object-cover"
								/>
							{/if}
							<div class="flex items-center gap-3 px-3 py-2.5">
								{#if !att.mimeType.startsWith('image/')}
									<FileText class="size-4 text-red-500 shrink-0" />
								{/if}
								<div class="flex-1 min-w-0">
									<p class="text-sm text-foreground truncate">{att.fileName}</p>
									<p class="text-xs text-muted-foreground">{formatFileSize(att.fileSize)}</p>
								</div>
								<button
									type="button"
									onclick={() => removePending(att.id)}
									class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
									title="Remove"
								>
									<X class="size-3.5" />
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
			<p class="text-xs text-muted-foreground mt-2">JPEG, PNG or PDF · max 10 MB per file · up to 10 files</p>
		</Card.Content>
	</Card.Root>
</div>

<!-- ── Location modal ──────────────────────────────────────────────── -->
{#if showLocationModal}
	<div
		class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
		role="presentation"
		onclick={(e) => { if (e.target === e.currentTarget) showLocationModal = false; }}
	>
		<div class="bg-card border border-border rounded-lg shadow-lg w-full max-w-sm">
			<div class="flex items-center justify-between px-5 py-4 border-b border-border">
				<h3 class="font-semibold text-foreground">Add Location</h3>
				<button
					onclick={() => (showLocationModal = false)}
					class="p-1 rounded text-muted-foreground hover:bg-muted"
				>
					<X class="size-4" />
				</button>
			</div>

			<div class="px-5 py-4 flex flex-col gap-4">
				{#if locationError}
					<p class="text-sm text-destructive">{locationError}</p>
				{/if}

				<div>
					<label class="text-sm font-medium block mb-1" for="loc-name">
						Name <span class="text-destructive">*</span>
					</label>
					<input
						id="loc-name"
						type="text"
						bind:value={newLocName}
						placeholder="e.g. Main Store"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>

				<div>
					<label class="text-sm font-medium block mb-1" for="loc-type">Type</label>
					<select
						id="loc-type"
						bind:value={newLocType}
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					>
						<option value="hq">HQ</option>
						<option value="branch">Branch</option>
						<option value="warehouse">Warehouse</option>
						<option value="online">Online</option>
					</select>
				</div>

				<div>
					<label class="text-sm font-medium block mb-1" for="loc-address">Address</label>
					<input
						id="loc-address"
						type="text"
						bind:value={newLocAddress}
						placeholder="Optional"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>
			</div>

			<div class="flex justify-end gap-2 px-5 py-4 border-t border-border">
				<button
					type="button"
					onclick={() => (showLocationModal = false)}
					class="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={saveLocation}
					disabled={savingLocation || !newLocName.trim()}
					class="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
				>
					{#if savingLocation}<Loader2 class="size-3.5 animate-spin" />{/if}
					Save
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ── Category modal ─────────────────────────────────────────────── -->
{#if showCategoryModal}
	<div
		class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
		role="presentation"
		onclick={(e) => { if (e.target === e.currentTarget) showCategoryModal = false; }}
	>
		<div class="bg-card border border-border rounded-lg shadow-lg w-full max-w-sm">
			<div class="flex items-center justify-between px-5 py-4 border-b border-border">
				<h3 class="font-semibold text-foreground">Add Category</h3>
				<button
					onclick={() => (showCategoryModal = false)}
					class="p-1 rounded text-muted-foreground hover:bg-muted"
				>
					<X class="size-4" />
				</button>
			</div>

			<div class="px-5 py-4 flex flex-col gap-4">
				{#if categoryError}
					<p class="text-sm text-destructive">{categoryError}</p>
				{/if}

				<div>
					<label class="text-sm font-medium block mb-1" for="cat-name">
						Name <span class="text-destructive">*</span>
					</label>
					<input
						id="cat-name"
						type="text"
						bind:value={newCatName}
						placeholder="e.g. Cost of Goods"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>

				<div>
					<label class="text-sm font-medium block mb-1" for="cat-type">Type</label>
					<select
						id="cat-type"
						bind:value={newCatType}
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					>
						<option value="income">Income</option>
						<option value="expense">Expense</option>
					</select>
				</div>
			</div>

			<div class="flex justify-end gap-2 px-5 py-4 border-t border-border">
				<button
					type="button"
					onclick={() => (showCategoryModal = false)}
					class="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={saveCategory}
					disabled={savingCategory || !newCatName.trim()}
					class="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
				>
					{#if savingCategory}<Loader2 class="size-3.5 animate-spin" />{/if}
					Save
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ── Channel modal ───────────────────────────────────────────────── -->
{#if showChannelModal}
	<div
		class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
		role="presentation"
		onclick={(e) => { if (e.target === e.currentTarget) showChannelModal = false; }}
	>
		<div class="bg-card border border-border rounded-lg shadow-lg w-full max-w-sm">
			<div class="flex items-center justify-between px-5 py-4 border-b border-border">
				<h3 class="font-semibold text-foreground">Add Sales Channel</h3>
				<button
					onclick={() => (showChannelModal = false)}
					class="p-1 rounded text-muted-foreground hover:bg-muted"
				>
					<X class="size-4" />
				</button>
			</div>

			<div class="px-5 py-4 flex flex-col gap-4">
				{#if channelError}
					<p class="text-sm text-destructive">{channelError}</p>
				{/if}

				<div>
					<label class="text-sm font-medium block mb-1" for="ch-name">
						Name <span class="text-destructive">*</span>
					</label>
					<input
						id="ch-name"
						type="text"
						bind:value={newChName}
						placeholder="e.g. Walk-in Sales"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>

				<div>
					<label class="text-sm font-medium block mb-1">Type</label>
					<div class="grid grid-cols-5 gap-1.5">
						{#each CHANNEL_TYPES as t}
							{@const meta = channelMeta[t]}
							<button
								type="button"
								onclick={() => (newChType = t)}
								class="flex flex-col items-center gap-1 px-1 py-2 rounded-md border text-xs font-medium transition-colors
									{newChType === t
									? 'border-primary bg-primary/10 text-primary'
									: 'border-input text-muted-foreground hover:border-muted-foreground hover:text-foreground'}"
								title={meta.label}
							>
								<svelte:component this={meta.icon} class="size-4 shrink-0" />
								<span class="truncate w-full text-center leading-tight">{meta.label}</span>
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="flex justify-end gap-2 px-5 py-4 border-t border-border">
				<button
					type="button"
					onclick={() => (showChannelModal = false)}
					class="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={saveChannel}
					disabled={savingChannel || !newChName.trim()}
					class="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
				>
					{#if savingChannel}<Loader2 class="size-3.5 animate-spin" />{/if}
					Save
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ── Contact modal ───────────────────────────────────────────────── -->
{#if showContactModal}
	<div
		class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
		role="presentation"
		onclick={(e) => { if (e.target === e.currentTarget) showContactModal = false; }}
	>
		<div class="bg-card border border-border rounded-lg shadow-lg w-full max-w-sm">
			<div class="flex items-center justify-between px-5 py-4 border-b border-border">
				<h3 class="font-semibold text-foreground">Add Contact</h3>
				<button
					onclick={() => (showContactModal = false)}
					class="p-1 rounded text-muted-foreground hover:bg-muted"
				>
					<X class="size-4" />
				</button>
			</div>

			<div class="px-5 py-4 flex flex-col gap-4">
				{#if contactError}
					<p class="text-sm text-destructive">{contactError}</p>
				{/if}

				<div>
					<label class="text-sm font-medium block mb-1" for="contact-name">
						Name <span class="text-destructive">*</span>
					</label>
					<input
						id="contact-name"
						type="text"
						bind:value={newContactName}
						placeholder="e.g. Acme Corp"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>

				<div class="flex gap-4">
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input type="checkbox" bind:checked={newContactIsClient} class="accent-primary" />
						Client
					</label>
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input type="checkbox" bind:checked={newContactIsSupplier} class="accent-primary" />
						Supplier
					</label>
				</div>
			</div>

			<div class="flex justify-end gap-2 px-5 py-4 border-t border-border">
				<button
					type="button"
					onclick={() => (showContactModal = false)}
					class="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={saveContact}
					disabled={savingContact || !newContactName.trim()}
					class="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
				>
					{#if savingContact}<Loader2 class="size-3.5 animate-spin" />{/if}
					Save
				</button>
			</div>
		</div>
	</div>
{/if}
