<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api } from '$lib/client/api.svelte';
	import { ArrowLeft, Loader2, Trash2, Printer, ArrowRightLeft, Send, Check, X as XIcon } from '@lucide/svelte';
	import { formatAmount } from '$lib/client/api.svelte';
	import LineItemsEditor from '$lib/components/LineItemsEditor.svelte';
	import ServicesEditor from '$lib/components/ServicesEditor.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { PLAN_KEY } from '$lib/configurations/plans';
	import CurrencyCombobox from '$lib/components/CurrencyCombobox.svelte';
	import { DatePicker } from '$lib/components/ui/date-picker';

	type Location = { id: string; name: string; type: string };
	type Channel = { id: string; name: string; type: string };
	type Category = { id: string; name: string; type: string };
	type Contact = { id: string; name: string; isClient: boolean; isSupplier: boolean; defaultCurrency: string | null };
	type Product = { id: string; name: string; sku: string | null; description: string | null; defaultPrice: number; defaultQty: number };
	type Quote = {
		id: string;
		lineItemMode: 'items' | 'services';
		quoteDate: string;
		expiryDate: string | null;
		dueDate: string | null;
		amount: number | null;
		originalAmount: number;
		originalCurrency: string;
		exchangeRate: number | null;
		locationId: string;
		salesChannelId: string | null;
		categoryId: string | null;
		contactId: string | null;
		note: string | null;
		referenceNo: string | null;
		quoteNo: string | null;
		status: string;
		featuredImageId: string | null;
	};
	type Conversion = {
		id: string;
		transactionId: string;
		note: string | null;
		createdAt: string;
		transaction: { id: string; amount: number; transactionDate: string; invoiceNo: string | null; note: string | null } | null;
	};
	type ItemAttachment = { id: string; fileName: string; mimeType: string };
	type LineItem = { description: string; quantity: number; unitPrice: string; attachments: ItemAttachment[]; productId: string };
	type ServiceItem = { description: string; hours: number; rate: string; attachments: ItemAttachment[] };

	const businessId = $page.params.businessId!;
	const quoteId = $page.params.quoteId!;
	const businessCurrency = $derived(($page.data as any).business?.currency ?? 'USD');
	const canUploadAttachment = $derived(
		($page.data.navBusinesses as { id: string; planKey: string }[])
			?.find((b) => b.id === businessId)?.planKey === PLAN_KEY.PRO
	);

	let locations = $state<Location[]>([]);
	let channels = $state<Channel[]>([]);
	let categories = $state<Category[]>([]);
	let contacts = $state<Contact[]>([]);
	let products = $state<Product[]>([]);
	let loadingMeta = $state(true);
	let loadError = $state<string | null>(null);

	// Form fields
	let quoteDate = $state('');
	let expiryDate = $state('');
	let dueDate = $state('');
	let locationId = $state('');
	let salesChannelId = $state('');
	let categoryId = $state('');
	let contactId = $state('');
	let note = $state('');
	let referenceNo = $state('');
	let quoteNo = $state('');
	let originalCurrency = $state('');
	let exchangeRateStr = $state('');
	let status = $state('draft');
	let conversions = $state<Conversion[]>([]);
	let convertNote = $state('');
	let convertAmountStr = $state('');
	let quoteAmount = $state(0);

	const convertedTotal = $derived(
		conversions.reduce((s, c) => s + (c.transaction?.amount ?? 0), 0)
	);
	const remaining = $derived(quoteAmount - convertedTotal);

	let submitting = $state(false);
	let submitError = $state<string | null>(null);

	let showDeleteConfirm = $state(false);
	let deleting = $state(false);
	let converting = $state(false);
	let updatingStatus = $state(false);

	const isSameCurrency = $derived(originalCurrency === businessCurrency);

	let filteredCategories = $derived(categories.filter((c) => c.type === 'income' || c.type === 'general'));
	let clientContacts = $derived(contacts.filter((c) => c.isClient));

	// Line items mode
	let lineItemMode = $state<'items' | 'services'>('items');
	let items = $state<LineItem[]>([]);
	let serviceItems = $state<ServiceItem[]>([]);

	function switchMode(m: 'items' | 'services') {
		if (m === lineItemMode) return;
		lineItemMode = m;
		if (m === 'items') serviceItems = [];
		else items = [];
	}

	const statusColors: Record<string, string> = {
		draft: 'bg-muted text-muted-foreground',
		sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
		accepted: 'bg-success-bg text-success-fg',
		rejected: 'bg-destructive/15 text-destructive',
		expired: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
	};

	async function loadMeta() {
		try {
			loadingMeta = true;
			loadError = null;
			const [locs, chans, cats, conts, prods, q, convs] = await Promise.all([
				api.get<Location[]>(`/businesses/${businessId}/locations`),
				api.get<Channel[]>(`/businesses/${businessId}/channels`),
				api.get<Category[]>(`/businesses/${businessId}/categories`),
				api.get<Contact[]>(`/businesses/${businessId}/contacts`),
				api.get<Product[]>(`/businesses/${businessId}/products`),
				api.get<Quote>(`/businesses/${businessId}/quotes/${quoteId}`),
				api.get<Conversion[]>(`/businesses/${businessId}/quotes/${quoteId}/conversions`)
			]);
			locations = locs;
			channels = chans;
			categories = cats;
			contacts = conts;
			products = prods;

			lineItemMode = q.lineItemMode ?? 'items';
			quoteDate = q.quoteDate;
			expiryDate = q.expiryDate ?? '';
			dueDate = q.dueDate ?? '';
			locationId = q.locationId;
			salesChannelId = q.salesChannelId ?? '';
			categoryId = q.categoryId ?? '';
			contactId = q.contactId ?? '';
			note = q.note ?? '';
			referenceNo = q.referenceNo ?? '';
			quoteNo = q.quoteNo ?? '';
			originalCurrency = q.originalCurrency ?? businessCurrency;
			exchangeRateStr = q.exchangeRate != null && q.originalCurrency !== businessCurrency
				? (q.exchangeRate / 1_000_000).toString()
				: '';
			status = q.status;
			quoteAmount = q.originalAmount;
			conversions = convs;
			const convTotal = convs.reduce((s: number, c: Conversion) => s + (c.transaction?.amount ?? 0), 0);
			convertAmountStr = ((q.originalAmount - convTotal) / 100).toFixed(2);

			if (lineItemMode === 'items') {
				const qItems = await api.get<{ id: string; description: string; quantity: number; unitPrice: number; sortOrder: number; productId: string; attachments: ItemAttachment[] }[]>(
					`/businesses/${businessId}/quotes/${quoteId}/items`
				);
				items = qItems.map((i) => ({
					description: i.description,
					quantity: i.quantity,
					unitPrice: (i.unitPrice / 100).toFixed(2),
					attachments: i.attachments ?? [],
					productId: i.productId
				}));
			} else {
				const qServiceItems = await api.get<{ id: string; description: string; hours: number; rate: number; sortOrder: number; attachments: ItemAttachment[] }[]>(
					`/businesses/${businessId}/quotes/${quoteId}/service-items`
				);
				serviceItems = qServiceItems.map((i) => ({
					description: i.description,
					hours: i.hours,
					rate: (i.rate / 100).toFixed(2),
					attachments: i.attachments ?? []
				}));
			}
		} catch (e) {
			loadError = e instanceof Error ? e.message : 'Failed to load quote';
		} finally {
			loadingMeta = false;
		}
	}

	async function submit() {
		if (!locationId || !quoteDate) return;
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
			const parsedRate = parseFloat(exchangeRateStr);
			await api.patch(`/businesses/${businessId}/quotes/${quoteId}`, {
				lineItemMode,
				quoteDate,
				expiryDate: expiryDate || null,
				dueDate: dueDate || null,
				amount: total,
				originalCurrency,
				exchangeRate: !isSameCurrency && parsedRate > 0 ? Math.round(parsedRate * 1_000_000) : undefined,
				locationId,
				salesChannelId: salesChannelId || undefined,
				categoryId: categoryId || undefined,
				contactId: contactId || null,
				note: note.trim() || undefined,
				referenceNo: referenceNo.trim() || undefined,
				quoteNo: quoteNo.trim() || null
			});
			if (lineItemMode === 'items') {
				await api.put(`/businesses/${businessId}/quotes/${quoteId}/items`,
					items.map((item, idx) => ({
						description: item.description,
						quantity: item.quantity,
						unitPrice: Math.round(parseFloat(item.unitPrice) * 100) || 0,
						sortOrder: idx,
						attachmentIds: item.attachments.map((a) => a.id),
						productId: item.productId,
					}))
				);
			} else {
				await api.put(`/businesses/${businessId}/quotes/${quoteId}/service-items`,
					serviceItems.map((item, idx) => ({
						description: item.description,
						hours: item.hours,
						rate: Math.round(parseFloat(item.rate) * 100) || 0,
						sortOrder: idx,
						attachmentIds: item.attachments.map((a) => a.id)
					}))
				);
			}
			goto(`/businesses/${businessId}/quotes`);
		} catch (e) {
			submitError = e instanceof Error ? e.message : 'Failed to update quote';
		} finally {
			submitting = false;
		}
	}

	async function deleteQuote() {
		try {
			deleting = true;
			await api.delete(`/businesses/${businessId}/quotes/${quoteId}`);
			goto(`/businesses/${businessId}/quotes`);
		} catch {
			deleting = false;
			showDeleteConfirm = false;
		}
	}

	async function updateStatus(newStatus: string) {
		try {
			updatingStatus = true;
			await api.patch(`/businesses/${businessId}/quotes/${quoteId}`, { status: newStatus });
			status = newStatus;
		} catch (e) {
			submitError = e instanceof Error ? e.message : 'Failed to update status';
		} finally {
			updatingStatus = false;
		}
	}

	async function convertToTransaction() {
		const cents = Math.round(parseFloat(convertAmountStr || '0') * 100);
		if (cents <= 0) {
			submitError = 'Enter an amount greater than zero.';
			return;
		}
		if (cents > remaining) {
			submitError = 'Amount exceeds remaining balance.';
			return;
		}
		try {
			converting = true;
			submitError = null;
			await api.post<{ transactionId: string }>(
				`/businesses/${businessId}/quotes/${quoteId}/convert`,
				{ note: convertNote.trim() || undefined, amount: cents }
			);
			// Refresh conversions list
			const convs = await api.get<Conversion[]>(`/businesses/${businessId}/quotes/${quoteId}/conversions`);
			conversions = convs;
			convertNote = '';
			const newRemaining = quoteAmount - convs.reduce((s: number, c: Conversion) => s + (c.transaction?.amount ?? 0), 0);
			convertAmountStr = (newRemaining / 100).toFixed(2);
			status = 'accepted';
		} catch (e) {
			submitError = e instanceof Error ? e.message : 'Failed to convert quote';
		} finally {
			converting = false;
		}
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
		<Button href="/businesses/{businessId}/quotes" variant="ghost" size="sm" class="-ml-2 gap-1.5 text-muted-foreground">
			<ArrowLeft class="size-3.5" /> Back
		</Button>
		{#if !loadingMeta && !loadError}
			<div class="flex items-center gap-1.5 flex-wrap">
				<span class="text-xs font-medium px-2 py-0.5 rounded-full {statusColors[status] ?? 'bg-muted text-muted-foreground'}">
					{status}
				</span>
				<div class="w-px h-4 bg-border mx-0.5 hidden sm:block"></div>
				{#if status === 'draft'}
					<Button size="sm" variant="ghost" class="h-7 px-2 text-xs" onclick={() => updateStatus('sent')} disabled={updatingStatus}>
						<Send class="size-3" /> Sent
					</Button>
				{/if}
				{#if status === 'sent' || status === 'draft'}
					<Button size="sm" variant="ghost" class="h-7 px-2 text-xs" onclick={() => updateStatus('accepted')} disabled={updatingStatus}>
						<Check class="size-3" /> Accept
					</Button>
					<Button size="sm" variant="ghost" class="h-7 px-2 text-xs" onclick={() => updateStatus('rejected')} disabled={updatingStatus}>
						<XIcon class="size-3" /> Reject
					</Button>
				{/if}
				{#if status === 'rejected' || status === 'expired'}
					<Button size="sm" variant="ghost" class="h-7 px-2 text-xs" onclick={() => updateStatus('draft')} disabled={updatingStatus}>
						Reopen
					</Button>
				{/if}
				<div class="w-px h-4 bg-border mx-0.5 hidden sm:block"></div>
				<Button href="/businesses/{businessId}/quotes/{quoteId}/print" variant="outline" size="sm" class="h-7 px-2 text-xs">
					<Printer class="size-3" /> PDF
				</Button>
				<Button
					variant="outline"
					size="sm"
					class="h-7 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
					onclick={() => (showDeleteConfirm = true)}
				>
					<Trash2 class="size-3" />
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

		<!-- Conversions & linked transactions -->
		{#if status === 'accepted' || conversions.length > 0}
			<div class="mb-4 rounded-lg border border-border bg-card overflow-hidden">
				{#if conversions.length > 0}
					{#each conversions as conv (conv.id)}
						<a
							href="/businesses/{businessId}/transactions/{conv.transactionId}"
							class="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
						>
							<ArrowRightLeft class="size-3.5 text-muted-foreground shrink-0" />
							<span class="text-sm text-foreground truncate flex-1">
								{conv.transaction?.invoiceNo ?? conv.note ?? 'Transaction'}
							</span>
							{#if conv.note}
								<span class="text-xs text-muted-foreground shrink-0 hidden sm:inline">{conv.note}</span>
							{/if}
							{#if conv.transaction}
								<span class="text-sm font-medium text-foreground shrink-0">
									{formatAmount(conv.transaction.amount, originalCurrency || businessCurrency)}
								</span>
							{/if}
						</a>
					{/each}
				{/if}
				{#if status === 'accepted' && remaining > 0}
					<div class="flex flex-col gap-2 px-4 py-2.5 {conversions.length > 0 ? 'border-t border-border' : ''}">
						<div class="flex items-center gap-2">
							<Input
								type="text"
								bind:value={convertNote}
								placeholder="Note (e.g. Partial delivery #1)"
								class="flex-1 h-8 text-sm"
							/>
							<Input
								type="number"
								step="0.01"
								min="0.01"
								bind:value={convertAmountStr}
								placeholder="Amount"
								class="w-28 h-8 text-sm text-right"
							/>
							<Button size="sm" variant="outline" class="h-8" onclick={convertToTransaction} disabled={converting || !convertAmountStr}>
								{#if converting}<Loader2 class="size-3.5 animate-spin" />{/if}
								<ArrowRightLeft class="size-3.5" /> Convert
							</Button>
						</div>
						<p class="text-xs text-muted-foreground">
							Remaining: <span class="font-medium text-foreground">{formatAmount(remaining, originalCurrency || businessCurrency)}</span>
							of {formatAmount(quoteAmount, originalCurrency || businessCurrency)}
						</p>
					</div>
				{:else if status === 'accepted' && remaining <= 0}
					<div class="px-4 py-2.5 {conversions.length > 0 ? 'border-t border-border' : ''}">
						<p class="text-xs text-muted-foreground">Fully converted.</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Two-column layout -->
		<div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">

			<!-- Left: Quote form -->
			<Card.Root>
				<Card.Header class="pb-3">
					<Card.Title class="text-base">Quote</Card.Title>
				</Card.Header>
				<Card.Content class="flex flex-col gap-4">
					<!-- Mode toggle -->
					<div class="space-y-1.5">
						<Label>Mode</Label>
						<div class="flex gap-2">
							{#each [['items', 'Line Items'], ['services', 'Services']] as [m, label]}
								<Button
									variant={lineItemMode === m ? 'default' : 'outline'}
									size="sm"
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

					<!-- Dates -->
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div class="space-y-1.5">
							<Label for="q-date">Quote Date <span class="text-destructive">*</span></Label>
							<DatePicker id="q-date" bind:value={quoteDate} />
						</div>
						<div class="space-y-1.5">
							<Label for="q-expiry">Expiry Date</Label>
							<DatePicker id="q-expiry" bind:value={expiryDate} placeholder="No expiry" />
						</div>
						<div class="space-y-1.5">
							<Label for="q-due">Due Date</Label>
							<DatePicker id="q-due" bind:value={dueDate} placeholder="No due date" />
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Right column -->
			<div class="flex flex-col gap-4">

				<!-- Classification -->
				<Card.Root>
					<Card.Header class="pb-3">
						<Card.Title class="text-base">Classification</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="grid grid-cols-2 gap-3">
							<div class="space-y-1.5">
								<Label>Location <span class="text-destructive">*</span></Label>
								<Select.Root type="single" bind:value={locationId}>
									<Select.Trigger class="w-full">
										<span class="truncate">{locationId ? locations.find((l) => l.id === locationId)?.name : 'Select location'}</span>
									</Select.Trigger>
									<Select.Content>
										{#each locations as loc (loc.id)}
											<Select.Item value={loc.id}>{loc.name}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
							<div class="space-y-1.5">
								<Label>Channel</Label>
								<Select.Root type="single" bind:value={salesChannelId}>
									<Select.Trigger class="w-full">
										<span class="truncate">{salesChannelId ? channels.find((c) => c.id === salesChannelId)?.name : 'No channel'}</span>
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="">No channel</Select.Item>
										{#each channels as ch (ch.id)}
											<Select.Item value={ch.id}>{ch.name}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
							<div class="space-y-1.5">
								<Label>Category</Label>
								<Select.Root type="single" bind:value={categoryId}>
									<Select.Trigger class="w-full">
										<span class="truncate">{categoryId ? filteredCategories.find((c) => c.id === categoryId)?.name : 'No category'}</span>
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="">No category</Select.Item>
										{#each filteredCategories as cat (cat.id)}
											<Select.Item value={cat.id}>{cat.name}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
							<div class="space-y-1.5">
								<Label>Client</Label>
								<Select.Root type="single" bind:value={contactId}>
									<Select.Trigger class="w-full">
										<span class="truncate">{contactId ? clientContacts.find((c) => c.id === contactId)?.name : 'No client'}</span>
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="">No client</Select.Item>
										{#each clientContacts as c (c.id)}
											<Select.Item value={c.id}>{c.name}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
						</div>
					</Card.Content>
				</Card.Root>

				<!-- Currency -->
				<Card.Root>
					<Card.Header class="pb-3">
						<Card.Title class="text-base">Currency</Card.Title>
					</Card.Header>
					<Card.Content class="flex flex-col gap-3">
						<div class="space-y-1.5">
							<Label>Currency</Label>
							<CurrencyCombobox bind:value={originalCurrency} />
						</div>
						{#if !isSameCurrency && originalCurrency}
							<div class="space-y-1.5">
								<Label for="q-rate">Exchange Rate</Label>
								<Input
									id="q-rate"
									type="number"
									step="0.000001"
									min="0"
									bind:value={exchangeRateStr}
									placeholder="e.g. 4.45"
								/>
								<p class="text-xs text-muted-foreground">
									1 {originalCurrency} = ? {businessCurrency}
								</p>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>

				<!-- Details -->
				<Card.Root>
					<Card.Header class="pb-3">
						<Card.Title class="text-base">Details</Card.Title>
					</Card.Header>
					<Card.Content class="flex flex-col gap-4">
						<div class="space-y-1.5">
							<Label for="q-note">Note</Label>
							<Input id="q-note" type="text" bind:value={note} placeholder="Optional note" />
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="space-y-1.5">
								<Label for="q-ref">Reference No.</Label>
								<Input id="q-ref" type="text" bind:value={referenceNo} placeholder="Optional" />
							</div>
							<div class="space-y-1.5">
								<Label for="q-no">Quote No.</Label>
								<Input id="q-no" type="text" bind:value={quoteNo} placeholder="e.g. QUOTE-0001" />
							</div>
						</div>
					</Card.Content>
				</Card.Root>

			</div><!-- end right column -->
		</div><!-- end grid -->

		<!-- Actions -->
		<div class="flex justify-end gap-2 mt-4">
			<Button href="/businesses/{businessId}/quotes" variant="ghost" size="sm">Cancel</Button>
			<Button size="sm" onclick={submit} disabled={submitting || !locationId || !quoteDate}>
				{#if submitting}<Loader2 class="size-4 animate-spin" />{/if}
				Save Changes
			</Button>
		</div>
	{/if}
</div>

<!-- Delete confirmation -->
<AlertDialog.Root bind:open={showDeleteConfirm}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Quote?</AlertDialog.Title>
			<AlertDialog.Description>This action cannot be undone.</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={deleteQuote}
				disabled={deleting}
				class="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50"
			>
				{#if deleting}<Loader2 class="size-4 animate-spin mr-1" />{/if}Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
