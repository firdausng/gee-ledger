<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api, formatAmount } from '$lib/client/api.svelte';
	import { parsePhone } from '$lib/data/phoneCodes';
	import PhoneCodeCombobox from '$lib/components/PhoneCodeCombobox.svelte';
	import CurrencyCombobox from '$lib/components/CurrencyCombobox.svelte';
	import AddressInput from '$lib/components/AddressInput.svelte';
	import {
		ArrowLeft, Loader2, ReceiptText, FileText, FolderKanban,
		ShoppingBag, Clock, TrendingUp, TrendingDown
	} from '@lucide/svelte';

	let { data } = $props();

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
	type Stats = {
		transactions: {
			total: number;
			incomeCount: number;
			expenseCount: number;
			totalIncome: number;
			totalExpense: number;
			lastTransactionDate: string | null;
		};
		products: { uniqueCount: number; totalQuantity: number };
		quotes: { total: number; totalAmount: number };
		projects: { total: number; totalTrackedMinutes: number };
		recentTransactions: {
			id: string;
			type: string;
			amount: number;
			originalAmount: number;
			originalCurrency: string;
			note: string | null;
			transactionDate: string;
			invoiceNo: string | null;
			receiptNo: string | null;
		}[];
	};

	const businessId = $page.params.businessId!;
	const contactId = $page.params.contactId!;
	const currency = data.business.currency;

	let contact = $state<Contact | null>(null);
	let stats = $state<Stats | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// ── Editable fields (always visible) ─────────────────────────────────────────
	let editName = $state('');
	let editEmail = $state('');
	let editPhoneCode = $state('+1');
	let editPhoneNumber = $state('');
	let editAddrLine1 = $state('');
	let editAddrLine2 = $state('');
	let editAddrCity = $state('');
	let editAddrState = $state('');
	let editAddrPostalCode = $state('');
	let editAddrCountry = $state('');
	let editTaxId = $state('');
	let editIsClient = $state(false);
	let editIsSupplier = $state(false);
	let editDefaultCurrency = $state('');
	let saving = $state(false);
	let saveError = $state<string | null>(null);
	let saveSuccess = $state(false);

	function populateFields(c: Contact) {
		const parsed = parsePhone(c.phone ?? '');
		editName = c.name;
		editEmail = c.email ?? '';
		editPhoneCode = parsed.code;
		editPhoneNumber = parsed.number;
		editAddrLine1 = c.addressLine1 ?? '';
		editAddrLine2 = c.addressLine2 ?? '';
		editAddrCity = c.addressCity ?? '';
		editAddrState = c.addressState ?? '';
		editAddrPostalCode = c.addressPostalCode ?? '';
		editAddrCountry = c.addressCountry ?? '';
		editTaxId = c.taxId ?? '';
		editIsClient = c.isClient;
		editIsSupplier = c.isSupplier;
		editDefaultCurrency = c.defaultCurrency ?? '';
	}

	const hasChanges = $derived.by(() => {
		if (!contact) return false;
		const parsed = parsePhone(contact.phone ?? '');
		const currentPhone = editPhoneNumber.trim()
			? `${editPhoneCode}${editPhoneNumber.trim()}`
			: null;
		const originalPhone = contact.phone || null;
		return (
			editName.trim() !== contact.name ||
			(editEmail.trim() || null) !== (contact.email || null) ||
			currentPhone !== originalPhone ||
			(editAddrLine1.trim() || null) !== (contact.addressLine1 || null) ||
			(editAddrLine2.trim() || null) !== (contact.addressLine2 || null) ||
			(editAddrCity.trim() || null) !== (contact.addressCity || null) ||
			(editAddrState.trim() || null) !== (contact.addressState || null) ||
			(editAddrPostalCode.trim() || null) !== (contact.addressPostalCode || null) ||
			(editAddrCountry.trim() || null) !== (contact.addressCountry || null) ||
			(editTaxId.trim() || null) !== (contact.taxId || null) ||
			editIsClient !== contact.isClient ||
			editIsSupplier !== contact.isSupplier ||
			(editDefaultCurrency || null) !== (contact.defaultCurrency || null)
		);
	});

	async function save() {
		if (!editName.trim()) return;
		try {
			saving = true;
			saveError = null;
			saveSuccess = false;
			const phone = editPhoneNumber.trim()
				? `${editPhoneCode}${editPhoneNumber.trim()}`
				: null;
			contact = await api.patch<Contact>(`/businesses/${businessId}/contacts/${contactId}`, {
				name: editName.trim(),
				email: editEmail.trim() || null,
				phone,
				addressLine1: editAddrLine1.trim() || null,
				addressLine2: editAddrLine2.trim() || null,
				addressCity: editAddrCity.trim() || null,
				addressState: editAddrState.trim() || null,
				addressPostalCode: editAddrPostalCode.trim() || null,
				addressCountry: editAddrCountry.trim() || null,
				taxId: editTaxId.trim() || null,
				isClient: editIsClient,
				isSupplier: editIsSupplier,
				defaultCurrency: editDefaultCurrency || null,
			});
			populateFields(contact);
			saveSuccess = true;
			setTimeout(() => (saveSuccess = false), 2000);
		} catch (e) {
			saveError = e instanceof Error ? e.message : 'Failed to update';
		} finally {
			saving = false;
		}
	}

	function discard() {
		if (contact) populateFields(contact);
		saveError = null;
	}

	function formatTime(minutes: number): string {
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return h > 0 ? `${h}h ${m}m` : `${m}m`;
	}

	async function load() {
		try {
			loading = true;
			error = null;
			const [c, s] = await Promise.all([
				api.get<Contact>(`/businesses/${businessId}/contacts/${contactId}`),
				api.get<Stats>(`/businesses/${businessId}/contacts/${contactId}/stats`),
			]);
			contact = c;
			stats = s;
			populateFields(c);
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
	{:else if error && !contact}
		<p class="text-destructive text-sm text-center py-8">{error}</p>
	{:else if contact && stats}
		<!-- Back link -->
		<div class="flex items-center gap-2 mb-4">
			<a
				href="/businesses/{businessId}/contacts"
				class="p-1 rounded text-muted-foreground hover:text-foreground shrink-0"
			>
				<ArrowLeft class="size-4" />
			</a>
			<h2 class="text-lg font-semibold text-foreground">Contact Details</h2>
		</div>

		<!-- Contact form (always editable) -->
		<div class="rounded-lg border border-border bg-card p-4 mb-6">
			{#if saveError}<p class="text-destructive text-sm mb-3">{saveError}</p>{/if}
			<div class="flex flex-col gap-3">
				<div>
					<label for="contact-name" class="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
					<input id="contact-name" type="text" bind:value={editName} placeholder="Name"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
				</div>
				<div class="grid sm:grid-cols-2 gap-3">
					<div>
						<label for="contact-email" class="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
						<input id="contact-email" type="email" bind:value={editEmail} placeholder="Email"
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
					</div>
					<div>
						<label class="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
						<div class="flex rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring overflow-hidden">
							<PhoneCodeCombobox bind:value={editPhoneCode} />
							<input type="tel" bind:value={editPhoneNumber} placeholder="Phone"
								class="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none text-foreground placeholder:text-muted-foreground" />
						</div>
					</div>
				</div>
				<div>
					<label class="text-xs font-medium text-muted-foreground mb-1 block">Address</label>
					<AddressInput bind:line1={editAddrLine1} bind:line2={editAddrLine2} bind:city={editAddrCity} bind:region={editAddrState} bind:postalCode={editAddrPostalCode} bind:country={editAddrCountry} />
				</div>
				<div class="grid sm:grid-cols-2 gap-3">
					<div>
						<label for="contact-taxid" class="text-xs font-medium text-muted-foreground mb-1 block">Tax ID / SST No.</label>
						<input id="contact-taxid" type="text" bind:value={editTaxId} placeholder="Tax ID / SST No."
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
					</div>
					<div>
						<label class="text-xs font-medium text-muted-foreground mb-1 block">Default Currency</label>
						<CurrencyCombobox bind:value={editDefaultCurrency} placeholder="Default Currency (none)" />
					</div>
				</div>
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

		<!-- Stats Grid -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
			<!-- Transactions -->
			<a
				href="/businesses/{businessId}/transactions?contactId={contactId}"
				class="rounded-lg border border-border bg-card p-4 hover:bg-muted/30 transition-colors"
			>
				<div class="flex items-center gap-2 text-muted-foreground mb-2">
					<ReceiptText class="size-4" />
					<span class="text-xs font-medium">Transactions</span>
				</div>
				<p class="text-2xl font-bold text-foreground">{stats.transactions.total}</p>
				<div class="flex gap-3 mt-1.5">
					<span class="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
						<TrendingUp class="size-3" />
						{formatAmount(stats.transactions.totalIncome, currency)}
					</span>
					<span class="text-xs text-red-600 dark:text-red-400 flex items-center gap-0.5">
						<TrendingDown class="size-3" />
						{formatAmount(stats.transactions.totalExpense, currency)}
					</span>
				</div>
			</a>

			<!-- Products -->
			<a
				href="/businesses/{businessId}/products"
				class="rounded-lg border border-border bg-card p-4 hover:bg-muted/30 transition-colors"
			>
				<div class="flex items-center gap-2 text-muted-foreground mb-2">
					<ShoppingBag class="size-4" />
					<span class="text-xs font-medium">Products</span>
				</div>
				<p class="text-2xl font-bold text-foreground">{stats.products.uniqueCount}</p>
				<p class="text-xs text-muted-foreground mt-1.5">
					{stats.products.totalQuantity} total qty
				</p>
			</a>

			<!-- Quotes -->
			<a
				href="/businesses/{businessId}/quotes?contactId={contactId}"
				class="rounded-lg border border-border bg-card p-4 hover:bg-muted/30 transition-colors"
			>
				<div class="flex items-center gap-2 text-muted-foreground mb-2">
					<FileText class="size-4" />
					<span class="text-xs font-medium">Quotes</span>
				</div>
				<p class="text-2xl font-bold text-foreground">{stats.quotes.total}</p>
				<p class="text-xs text-muted-foreground mt-1.5">
					{formatAmount(stats.quotes.totalAmount, currency)} total
				</p>
			</a>

			<!-- Projects -->
			<a
				href="/businesses/{businessId}/projects?contactId={contactId}"
				class="rounded-lg border border-border bg-card p-4 hover:bg-muted/30 transition-colors"
			>
				<div class="flex items-center gap-2 text-muted-foreground mb-2">
					<FolderKanban class="size-4" />
					<span class="text-xs font-medium">Projects</span>
				</div>
				<p class="text-2xl font-bold text-foreground">{stats.projects.total}</p>
				{#if stats.projects.totalTrackedMinutes > 0}
					<p class="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
						<Clock class="size-3" />
						{formatTime(stats.projects.totalTrackedMinutes)} tracked
					</p>
				{/if}
			</a>
		</div>

		<!-- Recent Transactions -->
		<div class="rounded-lg border border-border bg-card overflow-hidden">
			<div class="px-4 py-3 border-b border-border flex items-center justify-between">
				<h3 class="text-sm font-semibold text-foreground">Recent Transactions</h3>
				{#if stats.transactions.total > 0}
					<a
						href="/businesses/{businessId}/transactions?contactId={contactId}"
						class="text-xs text-primary hover:underline"
					>
						View all
					</a>
				{/if}
			</div>
			{#if stats.recentTransactions.length === 0}
				<div class="p-6 text-center text-sm text-muted-foreground">No transactions yet.</div>
			{:else}
				<div class="divide-y divide-border">
					{#each stats.recentTransactions as tx (tx.id)}
						<a
							href="/businesses/{businessId}/transactions/{tx.id}"
							class="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
						>
							<span class="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 {tx.type === 'income'
								? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
								: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}">
								{tx.type}
							</span>
							<div class="flex-1 min-w-0">
								<p class="text-sm text-foreground truncate">
									{tx.invoiceNo ?? tx.receiptNo ?? tx.note ?? '—'}
								</p>
								<p class="text-xs text-muted-foreground">
									{new Date(tx.transactionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
								</p>
							</div>
							<span class="text-sm font-semibold shrink-0 {tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}">
								{formatAmount(tx.originalAmount, tx.originalCurrency)}
							</span>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
