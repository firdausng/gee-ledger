<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api } from '$lib/client/api.svelte';
	import { ArrowLeft, Loader2, Plus } from '@lucide/svelte';
	import LineItemsEditor from '$lib/components/LineItemsEditor.svelte';
	import ServicesEditor from '$lib/components/ServicesEditor.svelte';
	import { PLAN_KEY } from '$lib/configurations/plans';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { DatePicker } from '$lib/components/ui/date-picker';

	type Location = { id: string; name: string; type: string };
	type Channel = { id: string; name: string; type: string };
	type Category = { id: string; name: string; type: string };
	type Contact = { id: string; name: string; isClient: boolean; isSupplier: boolean };
	type Product = { id: string; name: string; sku: string | null; description: string | null; defaultPrice: number; defaultQty: number };
	type ItemAttachment = { id: string; fileName: string; mimeType: string };
	type LineItem = { description: string; quantity: number; unitPrice: string; attachments: ItemAttachment[]; productId: string };
	type ServiceItem = { description: string; hours: number; rate: string; attachments: ItemAttachment[] };

	const businessId = $page.params.businessId!;
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

	// Form fields
	let quoteDate = $state(new Date().toISOString().slice(0, 10));
	let expiryDate = $state('');
	let dueDate = $state('');
	let locationId = $state('');
	let salesChannelId = $state('');
	let categoryId = $state('');
	let contactId = $state('');
	let note = $state('');
	let referenceNo = $state('');

	let submitting = $state(false);
	let submitError = $state<string | null>(null);

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

	let itemsTotal = $derived(
		lineItemMode === 'items'
			? items.reduce((sum, i) =>
					sum + Math.round(parseFloat(i.unitPrice || '0') * 100) * i.quantity, 0)
			: serviceItems.reduce((sum, i) =>
					sum + Math.round(i.hours * Math.round(parseFloat(i.rate || '0') * 100)), 0)
	);

	async function loadMeta() {
		try {
			loadingMeta = true;
			const [locs, chans, cats, ctcts, prods] = await Promise.all([
				api.get<Location[]>(`/businesses/${businessId}/locations`),
				api.get<Channel[]>(`/businesses/${businessId}/channels`),
				api.get<Category[]>(`/businesses/${businessId}/categories`),
				api.get<Contact[]>(`/businesses/${businessId}/contacts`),
				api.get<Product[]>(`/businesses/${businessId}/products`)
			]);
			locations = locs;
			channels = chans;
			categories = cats;
			contacts = ctcts;
			products = prods;
			if (locs.length > 0) locationId = locs[0].id;
		} catch {
			// non-critical
		} finally {
			loadingMeta = false;
		}
	}

	async function createProductInline(name: string, defaultPrice: number): Promise<Product> {
		const p = await api.post<Product>(`/businesses/${businessId}/products`, {
			name, defaultPrice
		});
		products = [...products, p];
		return p;
	}

	async function submit() {
		if (!locationId || !quoteDate) return;
		if (itemsTotal <= 0) {
			submitError = 'Add at least one item with a price greater than zero.';
			return;
		}

		try {
			submitting = true;
			submitError = null;
			const q = await api.post<{ id: string }>(`/businesses/${businessId}/quotes`, {
				lineItemMode,
				quoteDate,
				expiryDate: expiryDate || undefined,
				dueDate: dueDate || undefined,
				amount: itemsTotal,
				locationId,
				salesChannelId: salesChannelId || undefined,
				categoryId: categoryId || undefined,
				contactId: contactId || undefined,
				note: note.trim() || undefined,
				referenceNo: referenceNo.trim() || undefined
			});
			if (lineItemMode === 'items') {
				await api.put(`/businesses/${businessId}/quotes/${q.id}/items`,
					items.map((i, idx) => ({
						description:   i.description,
						quantity:      i.quantity,
						unitPrice:     Math.round(parseFloat(i.unitPrice) * 100),
						sortOrder:     idx,
						attachmentIds: i.attachments.map((a) => a.id),
						productId:     i.productId,
					}))
				);
			} else {
				await api.put(`/businesses/${businessId}/quotes/${q.id}/service-items`,
					serviceItems.map((i, idx) => ({
						description:   i.description,
						hours:         i.hours,
						rate:          Math.round(parseFloat(i.rate) * 100),
						sortOrder:     idx,
						attachmentIds: i.attachments.map((a) => a.id),
					}))
				);
			}
			goto(`/businesses/${businessId}/quotes`);
		} catch (e) {
			submitError = e instanceof Error ? e.message : 'Failed to create quote';
		} finally {
			submitting = false;
		}
	}

	onMount(loadMeta);
</script>

<div>
	<a
		href="/businesses/{businessId}/quotes"
		class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
	>
		<ArrowLeft class="size-3.5" />
		Back to Quotes
	</a>

	<h2 class="text-lg font-semibold text-foreground mb-5">New Quote</h2>

	{#if submitError}
		<div class="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{submitError}</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 lg:items-stretch">

		<!-- Left: Line Items -->
		<Card.Root>
			<Card.Content class="flex flex-col gap-4 pt-5">
				<div class="flex items-center justify-between">
					<Label>
						{lineItemMode === 'items' ? 'Line Items' : 'Services'} <span class="text-destructive">*</span>
					</Label>
					<div class="flex gap-1">
						{#each [['items', 'Items'], ['services', 'Services']] as [m, label]}
							<Button
								variant={lineItemMode === m ? 'default' : 'ghost'}
								size="sm"
								class="h-6 px-2 text-xs"
								onclick={() => switchMode(m as 'items' | 'services')}
							>
								{label}
							</Button>
						{/each}
					</div>
				</div>
				{#if lineItemMode === 'items'}
					<LineItemsEditor bind:items {businessId} {canUploadAttachment} {products} onCreateProduct={createProductInline} />
				{:else}
					<ServicesEditor bind:items={serviceItems} {businessId} {canUploadAttachment} />
				{/if}

				<!-- Note -->
				<div class="space-y-1.5">
					<Label for="q-note">Note</Label>
					<Input id="q-note" type="text" bind:value={note} placeholder="Optional note" />
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Right: Details -->
		<Card.Root>
			<Card.Content class="flex flex-col gap-4 pt-5">
				<!-- Quote Date -->
				<div class="space-y-1.5">
					<Label for="q-date">Quote Date <span class="text-destructive">*</span></Label>
					<DatePicker id="q-date" bind:value={quoteDate} />
				</div>

				<!-- Expiry Date -->
				<div class="space-y-1.5">
					<Label for="q-expiry">Expiry Date</Label>
					<DatePicker id="q-expiry" bind:value={expiryDate} placeholder="No expiry" />
				</div>

				<!-- Due Date -->
				<div class="space-y-1.5">
					<Label for="q-due">Due Date</Label>
					<DatePicker id="q-due" bind:value={dueDate} placeholder="No due date" />
				</div>

				<!-- Location -->
				<div class="space-y-1.5">
					<Label>Location <span class="text-destructive">*</span></Label>
					{#if loadingMeta}
						<div class="h-9 rounded-md border border-input bg-muted animate-pulse"></div>
					{:else if locations.length === 0}
						<p class="text-sm text-muted-foreground">No locations yet. Add one in Settings.</p>
					{:else}
						<Select.Root type="single" bind:value={locationId}>
							<Select.Trigger>
								{locationId ? locations.find((l) => l.id === locationId)?.name : 'Select location'}
							</Select.Trigger>
							<Select.Content>
								{#each locations as loc (loc.id)}
									<Select.Item value={loc.id}>{loc.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					{/if}
				</div>

				<!-- Channel -->
				<div class="space-y-1.5">
					<Label>Channel</Label>
					<Select.Root type="single" bind:value={salesChannelId}>
						<Select.Trigger>
							{salesChannelId ? channels.find((c) => c.id === salesChannelId)?.name : 'No channel'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">No channel</Select.Item>
							{#each channels as ch (ch.id)}
								<Select.Item value={ch.id}>{ch.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="border-t border-border"></div>

				<!-- Category -->
				<div class="space-y-1.5">
					<Label>Category</Label>
					<Select.Root type="single" bind:value={categoryId}>
						<Select.Trigger>
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

				<!-- Client -->
				<div class="space-y-1.5">
					<Label>Client</Label>
					<Select.Root type="single" bind:value={contactId}>
						<Select.Trigger>
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

				<!-- Reference No. -->
				<div class="space-y-1.5">
					<Label for="q-ref">Reference No.</Label>
					<Input id="q-ref" type="text" bind:value={referenceNo} placeholder="Optional" />
				</div>
			</Card.Content>
		</Card.Root>

	</div><!-- end grid -->

	<!-- Actions -->
	<div class="flex justify-end gap-2 mt-4">
		<Button href="/businesses/{businessId}/quotes" variant="ghost" size="sm">Cancel</Button>
		<Button
			size="sm"
			onclick={submit}
			disabled={submitting || !locationId || itemsTotal <= 0 || !quoteDate}
		>
			{#if submitting}<Loader2 class="size-4 animate-spin" />{/if}
			Save Quote
		</Button>
	</div>
</div>
