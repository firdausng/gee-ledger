<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/client/api.svelte';
	import PhoneCodeCombobox from '$lib/components/PhoneCodeCombobox.svelte';
	import CurrencyCombobox from '$lib/components/CurrencyCombobox.svelte';
	import AddressInput from '$lib/components/AddressInput.svelte';
	import { Plus, Loader2, Trash2, UsersRound, Download, Crown, Search } from '@lucide/svelte';
	import { PLAN_KEY } from '$lib/configurations/plans';

	type Contact = {
		id: string;
		name: string;
		email: string | null;
		phone: string | null;
		addressLine1: string | null;
		addressLine2: string | null;
		addressCity: string | null;
		addressState: string | null;
		addressPostalCode: string | null;
		addressCountry: string | null;
		taxId: string | null;
		isClient: boolean;
		isSupplier: boolean;
		defaultCurrency: string | null;
	};

	const businessId = $page.params.businessId!;
	const canExport = $derived(
		($page.data.navBusinesses as { id: string; planKey: string }[])
			?.find((b) => b.id === businessId)?.planKey === PLAN_KEY.PRO
	);

	let contacts   = $state<Contact[]>([]);
	let loading    = $state(true);
	let error      = $state<string | null>(null);

	let activeTab = $state<'all' | 'client' | 'supplier'>('all');
	let searchQuery = $state('');
	let serverSearch = $state('');

	const filteredContacts = $derived.by(() => {
		let list = activeTab === 'all'
			? contacts
			: activeTab === 'client'
				? contacts.filter((c) => c.isClient)
				: contacts.filter((c) => c.isSupplier);
		const q = searchQuery.trim().toLowerCase();
		if (q && q !== serverSearch.toLowerCase()) {
			list = list.filter((c) =>
				c.name.toLowerCase().includes(q) ||
				(c.email && c.email.toLowerCase().includes(q))
			);
		}
		return list;
	});

	// ── Create ───────────────────────────────────────────────────────────────────
	let showCreate     = $state(false);
	let createName     = $state('');
	let createEmail    = $state('');
	let createPhoneCode   = $state('+1');
	let createPhoneNumber = $state('');
	let createAddrLine1 = $state('');
	let createAddrLine2 = $state('');
	let createAddrCity = $state('');
	let createAddrState = $state('');
	let createAddrPostalCode = $state('');
	let createAddrCountry = $state('');
	let createTaxId    = $state('');
	let createIsClient   = $state(false);
	let createIsSupplier = $state(false);
	let createDefaultCurrency = $state('');
	let creating       = $state(false);
	let createError    = $state<string | null>(null);

	// ── Delete ───────────────────────────────────────────────────────────────────
	let deleteId  = $state<string | null>(null);
	let deleting  = $state(false);

	async function load(search?: string) {
		try {
			loading = true;
			error = null;
			const params = new URLSearchParams();
			if (search) params.set('search', search);
			const qs = params.toString();
			contacts = await api.get<Contact[]>(`/businesses/${businessId}/contacts${qs ? `?${qs}` : ''}`);
			serverSearch = search ?? '';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
		}
	}

	function handleSearch() {
		const q = searchQuery.trim();
		if (q !== serverSearch) {
			load(q || undefined);
		}
	}

	async function create() {
		if (!createName.trim()) return;
		try {
			creating = true;
			createError = null;
			const phone = createPhoneNumber.trim()
				? `${createPhoneCode}${createPhoneNumber.trim()}`
				: undefined;
			const c = await api.post<Contact>(`/businesses/${businessId}/contacts`, {
				name:       createName.trim(),
				email:      createEmail.trim() || undefined,
				phone,
				addressLine1: createAddrLine1.trim() || undefined,
				addressLine2: createAddrLine2.trim() || undefined,
				addressCity: createAddrCity.trim() || undefined,
				addressState: createAddrState.trim() || undefined,
				addressPostalCode: createAddrPostalCode.trim() || undefined,
				addressCountry: createAddrCountry.trim() || undefined,
				taxId:      createTaxId.trim() || undefined,
				isClient:   createIsClient,
				isSupplier: createIsSupplier,
				defaultCurrency: createDefaultCurrency || undefined,
			});
			contacts = [...contacts, c];
			showCreate   = false;
			createName   = '';
			createEmail  = '';
			createPhoneCode   = '+1';
			createPhoneNumber = '';
			createAddrLine1 = '';
			createAddrLine2 = '';
			createAddrCity = '';
			createAddrState = '';
			createAddrPostalCode = '';
			createAddrCountry = '';
			createTaxId  = '';
			createIsClient   = false;
			createIsSupplier = false;
			createDefaultCurrency = '';
		} catch (e) {
			createError = e instanceof Error ? e.message : 'Failed to create';
		} finally {
			creating = false;
		}
	}

	async function deleteContact(id: string) {
		try {
			deleting = true;
			await api.delete(`/businesses/${businessId}/contacts/${id}`);
			contacts = contacts.filter((c) => c.id !== id);
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
		<h2 class="font-semibold text-foreground">Contacts</h2>
		<div class="flex items-center gap-2">
			{#if canExport}
				<a
					href="/api/businesses/{businessId}/contacts/export"
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
				>
					<Download class="size-4" />
					Export
				</a>
			{:else}
				<button
					disabled
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input bg-background text-sm font-medium text-muted-foreground opacity-60 cursor-not-allowed"
					title="Upgrade to Pro to export data"
				>
					<Download class="size-4" />
					Export
					<Crown class="size-3 text-amber-500" />
				</button>
			{/if}
			<button
				onclick={() => { showCreate = !showCreate; createError = null; }}
				class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
			>
				<Plus class="size-4" />
				Add Contact
			</button>
		</div>
	</div>

	<!-- Tabs -->
	<div class="flex gap-1 p-1 rounded-lg bg-muted mb-4 w-fit">
		{#each [['all', 'All'], ['client', 'Clients'], ['supplier', 'Suppliers']] as [tab, label]}
			<button
				onclick={() => (activeTab = tab as typeof activeTab)}
				class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors
					{activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
			>
				{label}
			</button>
		{/each}
	</div>

	<!-- Search -->
	<div class="relative mb-4">
		<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search by name or email… (Enter to search server)"
			onkeydown={(e) => { if (e.key === 'Enter') handleSearch(); }}
			class="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
		/>
	</div>

	<!-- Create form -->
	{#if showCreate}
		<div class="rounded-lg border border-border bg-card p-4 mb-4">
			<h3 class="text-sm font-semibold mb-3">New Contact</h3>
			{#if createError}<p class="text-destructive text-sm mb-2">{createError}</p>{/if}
			<div class="flex flex-col gap-3">
				<input type="text" bind:value={createName} placeholder="Name *"
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
				<input type="email" bind:value={createEmail} placeholder="Email"
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
				<div class="flex rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring overflow-hidden">
					<PhoneCodeCombobox bind:value={createPhoneCode} />
					<input type="tel" bind:value={createPhoneNumber} placeholder="Phone"
						class="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none text-foreground placeholder:text-muted-foreground" />
				</div>
				<AddressInput bind:line1={createAddrLine1} bind:line2={createAddrLine2} bind:city={createAddrCity} bind:region={createAddrState} bind:postalCode={createAddrPostalCode} bind:country={createAddrCountry} />
				<input type="text" bind:value={createTaxId} placeholder="Tax ID / SST No."
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
				<CurrencyCombobox bind:value={createDefaultCurrency} placeholder="Default Currency (none)" />
				<div class="flex gap-4">
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input type="checkbox" bind:checked={createIsClient} class="accent-primary" />
						Client
					</label>
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input type="checkbox" bind:checked={createIsSupplier} class="accent-primary" />
						Supplier
					</label>
				</div>
				<div class="flex justify-end gap-2">
					<button onclick={() => { showCreate = false; createError = null; }}
						class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted">
						Cancel
					</button>
					<button onclick={create} disabled={creating || !createName.trim()}
						class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
						{#if creating}<Loader2 class="size-4 animate-spin" />{/if}
						Create
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if error}<p class="text-destructive text-sm mb-4">{error}</p>{/if}

	{#if loading}
		<div class="flex justify-center py-12">
			<Loader2 class="size-7 animate-spin text-muted-foreground" />
		</div>
	{:else if filteredContacts.length === 0}
		<div class="rounded-lg border border-border bg-card p-10 text-center">
			<UsersRound class="size-8 text-muted-foreground mx-auto mb-2" />
			<p class="text-muted-foreground text-sm">No contacts yet.</p>
		</div>
	{:else}
		<div class="rounded-lg border border-border overflow-hidden">
			{#each filteredContacts as c (c.id)}
				<div class="flex items-start border-b border-border last:border-0 bg-card hover:bg-muted/30 transition-colors">
					<a
						href="/businesses/{businessId}/contacts/{c.id}"
						class="flex items-start gap-3 px-4 py-3 flex-1 min-w-0"
					>
						<UsersRound class="size-4 text-muted-foreground shrink-0 mt-0.5" />
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-foreground">{c.name}</p>
							{#if c.email}
								<p class="text-xs text-muted-foreground">{c.email}</p>
							{/if}
						</div>
						<div class="flex items-center gap-1.5 shrink-0">
							{#if c.isClient}
								<span class="text-xs px-2 py-0.5 rounded-full bg-info-bg text-info-fg">Client</span>
							{/if}
							{#if c.isSupplier}
								<span class="text-xs px-2 py-0.5 rounded-full bg-warning-bg text-warning-fg">Supplier</span>
							{/if}
						</div>
					</a>
					<div class="flex items-center gap-1 px-2 py-3 shrink-0">
						<button onclick={() => (deleteId = c.id)}
							class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10">
							<Trash2 class="size-3.5" />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Delete confirmation -->
{#if deleteId}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
		<div class="bg-card rounded-lg border border-border p-6 max-w-sm w-full shadow-lg">
			<h3 class="font-semibold text-foreground mb-2">Delete Contact?</h3>
			<p class="text-sm text-muted-foreground mb-5">This action cannot be undone.</p>
			<div class="flex justify-end gap-2">
				<button onclick={() => (deleteId = null)}
					class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted">
					Cancel
				</button>
				<button onclick={() => deleteContact(deleteId!)} disabled={deleting}
					class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50">
					{#if deleting}<Loader2 class="size-4 animate-spin" />{/if}
					Delete
				</button>
			</div>
		</div>
	</div>
{/if}
