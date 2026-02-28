<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/client/api.svelte';
	import { PHONE_CODES, parsePhone } from '$lib/data/phoneCodes';
	import { Plus, Loader2, Pencil, Trash2, UsersRound } from '@lucide/svelte';

	type Contact = {
		id: string;
		name: string;
		email: string | null;
		phone: string | null;
		address: string | null;
		taxId: string | null;
		isClient: boolean;
		isSupplier: boolean;
	};

	const businessId = $page.params.businessId;

	let contacts   = $state<Contact[]>([]);
	let loading    = $state(true);
	let error      = $state<string | null>(null);

	let activeTab = $state<'all' | 'client' | 'supplier'>('all');

	const filteredContacts = $derived(
		activeTab === 'all'
			? contacts
			: activeTab === 'client'
				? contacts.filter((c) => c.isClient)
				: contacts.filter((c) => c.isSupplier)
	);

	// ── Create ───────────────────────────────────────────────────────────────────
	let showCreate     = $state(false);
	let createName     = $state('');
	let createEmail    = $state('');
	let createPhoneCode   = $state('+1');
	let createPhoneNumber = $state('');
	let createAddress  = $state('');
	let createTaxId    = $state('');
	let createIsClient   = $state(false);
	let createIsSupplier = $state(false);
	let creating       = $state(false);
	let createError    = $state<string | null>(null);

	// ── Edit ─────────────────────────────────────────────────────────────────────
	let editId         = $state<string | null>(null);
	let editName       = $state('');
	let editEmail      = $state('');
	let editPhoneCode     = $state('+1');
	let editPhoneNumber   = $state('');
	let editAddress    = $state('');
	let editTaxId      = $state('');
	let editIsClient   = $state(false);
	let editIsSupplier = $state(false);
	let editing        = $state(false);
	let editError      = $state<string | null>(null);

	// ── Delete ───────────────────────────────────────────────────────────────────
	let deleteId  = $state<string | null>(null);
	let deleting  = $state(false);

	async function load() {
		try {
			loading = true;
			error = null;
			contacts = await api.get<Contact[]>(`/businesses/${businessId}/contacts`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
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
				address:    createAddress.trim() || undefined,
				taxId:      createTaxId.trim() || undefined,
				isClient:   createIsClient,
				isSupplier: createIsSupplier,
			});
			contacts = [...contacts, c];
			showCreate   = false;
			createName   = '';
			createEmail  = '';
			createPhoneCode   = '+1';
			createPhoneNumber = '';
			createAddress = '';
			createTaxId  = '';
			createIsClient   = false;
			createIsSupplier = false;
		} catch (e) {
			createError = e instanceof Error ? e.message : 'Failed to create';
		} finally {
			creating = false;
		}
	}

	function startEdit(c: Contact) {
		const parsed = parsePhone(c.phone ?? '');
		editId         = c.id;
		editName       = c.name;
		editEmail      = c.email ?? '';
		editPhoneCode     = parsed.code;
		editPhoneNumber   = parsed.number;
		editAddress    = c.address ?? '';
		editTaxId      = c.taxId ?? '';
		editIsClient   = c.isClient;
		editIsSupplier = c.isSupplier;
		editError      = null;
	}

	async function saveEdit() {
		if (!editId || !editName.trim()) return;
		try {
			editing = true;
			editError = null;
			const phone = editPhoneNumber.trim()
				? `${editPhoneCode}${editPhoneNumber.trim()}`
				: null;
			const updated = await api.patch<Contact>(`/businesses/${businessId}/contacts/${editId}`, {
				name:       editName.trim(),
				email:      editEmail.trim() || null,
				phone,
				address:    editAddress.trim() || null,
				taxId:      editTaxId.trim() || null,
				isClient:   editIsClient,
				isSupplier: editIsSupplier,
			});
			contacts = contacts.map((c) => (c.id === editId ? updated : c));
			editId = null;
		} catch (e) {
			editError = e instanceof Error ? e.message : 'Failed to update';
		} finally {
			editing = false;
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
		<button
			onclick={() => { showCreate = !showCreate; createError = null; }}
			class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
		>
			<Plus class="size-4" />
			Add Contact
		</button>
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
					<select bind:value={createPhoneCode}
						class="shrink-0 bg-transparent border-r border-input pl-2 pr-1 py-2 text-sm focus:outline-none text-foreground">
						{#each PHONE_CODES as p (p.code)}
							<option value={p.code}>{p.flag} {p.code}</option>
						{/each}
					</select>
					<input type="tel" bind:value={createPhoneNumber} placeholder="Phone"
						class="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none text-foreground placeholder:text-muted-foreground" />
				</div>
				<textarea bind:value={createAddress} placeholder="Address" rows="3"
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"></textarea>
				<input type="text" bind:value={createTaxId} placeholder="Tax ID / SST No."
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
				{#if editId === c.id}
					<div class="p-4 border-b border-border last:border-0 bg-muted/30">
						{#if editError}<p class="text-destructive text-sm mb-2">{editError}</p>{/if}
						<div class="flex flex-col gap-3">
							<input type="text" bind:value={editName} placeholder="Name *"
								class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
							<input type="email" bind:value={editEmail} placeholder="Email"
								class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
							<div class="flex rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring overflow-hidden">
								<select bind:value={editPhoneCode}
									class="shrink-0 bg-transparent border-r border-input pl-2 pr-1 py-2 text-sm focus:outline-none text-foreground">
									{#each PHONE_CODES as p (p.code)}
										<option value={p.code}>{p.flag} {p.code}</option>
									{/each}
								</select>
								<input type="tel" bind:value={editPhoneNumber} placeholder="Phone"
									class="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none text-foreground placeholder:text-muted-foreground" />
							</div>
							<textarea bind:value={editAddress} placeholder="Address" rows="3"
								class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"></textarea>
							<input type="text" bind:value={editTaxId} placeholder="Tax ID / SST No."
								class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
							<div class="flex gap-4">
								<label class="flex items-center gap-2 text-sm cursor-pointer">
									<input type="checkbox" bind:checked={editIsClient} class="accent-primary" />
									Client
								</label>
								<label class="flex items-center gap-2 text-sm cursor-pointer">
									<input type="checkbox" bind:checked={editIsSupplier} class="accent-primary" />
									Supplier
								</label>
							</div>
							<div class="flex justify-end gap-2">
								<button onclick={() => (editId = null)}
									class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted">
									Cancel
								</button>
								<button onclick={saveEdit} disabled={editing || !editName.trim()}
									class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
									{#if editing}<Loader2 class="size-4 animate-spin" />{/if}
									Save
								</button>
							</div>
						</div>
					</div>
				{:else}
					<div class="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 bg-card hover:bg-muted/30 transition-colors">
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
							<button onclick={() => startEdit(c)}
								class="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted">
								<Pencil class="size-3.5" />
							</button>
							<button onclick={() => (deleteId = c.id)}
								class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10">
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
