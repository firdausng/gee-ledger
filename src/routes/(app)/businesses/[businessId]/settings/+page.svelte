<script lang="ts">
	import { page } from '$app/stores';
	import { api } from '$lib/client/api.svelte';
	import { Settings2, Loader2, Upload, ImageOff, ChevronsUpDown, Check } from '@lucide/svelte';
	import { CURRENCIES } from '$lib/data/currencies';
	import { PHONE_CODES, parsePhone } from '$lib/data/phoneCodes';

	let { data } = $props();

	const businessId = $page.params.businessId;
	const biz = data.business;

	// ── Business Info ──────────────────────────────────────────────
	let infoName        = $state(biz.name ?? '');
	let infoDescription = $state(biz.description ?? '');
	let infoCurrency    = $state(biz.currency ?? 'USD');
	let infoSaving      = $state(false);
	let infoError       = $state<string | null>(null);
	let infoSuccess     = $state(false);

	// ── Contact & Legal ────────────────────────────────────────────
	let contactAddress = $state(biz.address ?? '');
	let contactTaxId   = $state(biz.taxId ?? '');

	// ── Phone with country code ─────────────────────────────────────
	const parsedPhone = parsePhone(biz.phone ?? '');
	let contactPhoneCode   = $state(parsedPhone.code);
	let contactPhoneNumber = $state(parsedPhone.number);
	let contactSaving  = $state(false);
	let contactError   = $state<string | null>(null);
	let contactSuccess = $state(false);

	// ── Logo ───────────────────────────────────────────────────────
	let logoInput: HTMLInputElement;
	let logoPreview    = $state<string | null>(biz.logoR2Key ? `/api/businesses/${businessId}/logo` : null);
	let logoUploading  = $state(false);
	let logoError      = $state<string | null>(null);
	let logoSuccess    = $state(false);

	async function saveInfo() {
		try {
			infoSaving = true;
			infoError = null;
			infoSuccess = false;
			await api.patch(`/businesses/${businessId}`, {
				name:        infoName,
				description: infoDescription || undefined,
				currency:    infoCurrency,
			});
			infoSuccess = true;
			setTimeout(() => (infoSuccess = false), 3000);
		} catch (e) {
			infoError = e instanceof Error ? e.message : 'Failed to save';
		} finally {
			infoSaving = false;
		}
	}

	async function saveContact() {
		try {
			contactSaving = true;
			contactError = null;
			contactSuccess = false;
			await api.patch(`/businesses/${businessId}`, {
				address: contactAddress || undefined,
				phone:   contactPhoneNumber.trim() ? `${contactPhoneCode}${contactPhoneNumber.trim()}` : undefined,
				taxId:   contactTaxId   || undefined,
			});
			contactSuccess = true;
			setTimeout(() => (contactSuccess = false), 3000);
		} catch (e) {
			contactError = e instanceof Error ? e.message : 'Failed to save';
		} finally {
			contactSaving = false;
		}
	}

	async function uploadLogo(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		try {
			logoUploading = true;
			logoError = null;
			logoSuccess = false;
			const fd = new FormData();
			fd.append('file', file);
			await api.upload(`/businesses/${businessId}/logo`, fd);
			// Bust the cached image by appending a timestamp
			logoPreview = `/api/businesses/${businessId}/logo?t=${Date.now()}`;
			logoSuccess = true;
			setTimeout(() => (logoSuccess = false), 3000);
		} catch (e) {
			logoError = e instanceof Error ? e.message : 'Failed to upload';
		} finally {
			logoUploading = false;
		}
	}

	// ── Currency dropdown ───────────────────────────────────────────
	let currencyOpen = $state(false);
	let currencySearch = $state('');
	let currencyContainer: HTMLDivElement;

	const filteredCurrencies = $derived(
		currencySearch.trim()
			? CURRENCIES.filter(
					(c) =>
						c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
						c.name.toLowerCase().includes(currencySearch.toLowerCase())
				)
			: CURRENCIES
	);

	const selectedCurrency = $derived(CURRENCIES.find((c) => c.code === infoCurrency));

	function selectCurrency(code: string) {
		infoCurrency = code;
		currencyOpen = false;
		currencySearch = '';
	}

	$effect(() => {
		if (!currencyOpen) return;
		function handleClick(e: MouseEvent) {
			if (!currencyContainer?.contains(e.target as Node)) {
				currencyOpen = false;
				currencySearch = '';
			}
		}
		document.addEventListener('click', handleClick);
		return () => document.removeEventListener('click', handleClick);
	});

	const inputClass = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';
	const labelClass = 'block text-sm font-medium text-foreground mb-1';
	const sectionClass = 'rounded-lg border border-border bg-card p-5 mb-4';
</script>

<div>
	<div class="flex items-center gap-2 mb-6">
		<Settings2 class="size-5 text-muted-foreground" />
		<div>
			<h2 class="font-semibold text-foreground">Settings</h2>
			<p class="text-xs text-muted-foreground mt-0.5">Manage your business profile</p>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
	<!-- Business Info -->
	<div class={sectionClass}>
		<h3 class="text-sm font-semibold text-foreground mb-4">Business Info</h3>
		<div class="flex flex-col gap-3">
			<div>
				<label class={labelClass} for="info-name">Name</label>
				<input id="info-name" class={inputClass} type="text" bind:value={infoName} />
			</div>
			<div>
				<label class={labelClass} for="info-desc">Description</label>
				<textarea id="info-desc" class="{inputClass} resize-none" rows="2" bind:value={infoDescription}></textarea>
			</div>
			<div>
				<label class={labelClass} for="info-currency">Currency</label>
				<div class="relative" bind:this={currencyContainer}>
					<button
						type="button"
						id="info-currency"
						onclick={() => { currencyOpen = !currencyOpen; currencySearch = ''; }}
						class="{inputClass} flex items-center justify-between gap-2 text-left cursor-pointer"
					>
						<span>
							<span class="font-mono font-medium">{infoCurrency}</span>
							{#if selectedCurrency}
								<span class="text-muted-foreground ml-1.5">— {selectedCurrency.name}</span>
							{/if}
						</span>
						<ChevronsUpDown class="size-4 text-muted-foreground shrink-0" />
					</button>
					{#if currencyOpen}
						<div class="absolute z-20 mt-1 w-full rounded-md border border-border bg-card shadow-lg overflow-hidden">
							<div class="border-b border-border px-3 py-2">
								<input
									type="text"
									bind:value={currencySearch}
									placeholder="Search currency…"
									autofocus
									class="w-full text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
								/>
							</div>
							<ul class="max-h-52 overflow-y-auto py-1">
								{#each filteredCurrencies as c (c.code)}
									<li>
										<button
											type="button"
											onclick={() => selectCurrency(c.code)}
											class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors {infoCurrency === c.code ? 'text-primary' : 'text-foreground'}"
										>
											<span class="font-mono w-10 shrink-0">{c.code}</span>
											<span class="text-muted-foreground flex-1 text-left truncate">{c.name}</span>
											{#if infoCurrency === c.code}
												<Check class="size-3.5 text-primary shrink-0" />
											{/if}
										</button>
									</li>
								{/each}
								{#if filteredCurrencies.length === 0}
									<li class="px-3 py-4 text-center text-sm text-muted-foreground">No currencies found</li>
								{/if}
							</ul>
						</div>
					{/if}
				</div>
			</div>
		</div>
		{#if infoError}
			<p class="text-destructive text-xs mt-3">{infoError}</p>
		{/if}
		<div class="flex items-center gap-3 mt-4">
			<button
				onclick={saveInfo}
				disabled={infoSaving}
				class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
			>
				{#if infoSaving}<Loader2 class="size-4 animate-spin inline mr-1.5" />{/if}
				Save
			</button>
			{#if infoSuccess}
				<span class="text-xs text-success-fg">Saved!</span>
			{/if}
		</div>
	</div>

	<!-- Right column: Contact & Legal + Logo -->
	<div class="flex flex-col gap-4">
	<!-- Contact & Legal -->
	<div class={sectionClass} style="margin-bottom:0">
		<h3 class="text-sm font-semibold text-foreground mb-4">Contact & Legal</h3>
		<p class="text-xs text-muted-foreground mb-4">Shown on invoices and receipts sent to customers.</p>
		<div class="flex flex-col gap-3">
			<div>
				<label class={labelClass} for="contact-address">Address</label>
				<textarea id="contact-address" class="{inputClass} resize-none" rows="5" bind:value={contactAddress} placeholder="123 Main St, City, Country"></textarea>
			</div>
			<div>
				<label class={labelClass} for="contact-phone-number">Phone</label>
				<div class="flex rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring overflow-hidden">
					<select
						bind:value={contactPhoneCode}
						class="shrink-0 bg-transparent border-r border-input pl-2 pr-1 py-2 text-sm focus:outline-none text-foreground"
					>
						{#each PHONE_CODES as p (p.code)}
							<option value={p.code}>{p.flag} {p.code}</option>
						{/each}
					</select>
					<input
						id="contact-phone-number"
						type="tel"
						bind:value={contactPhoneNumber}
						placeholder="12-345 6789"
						class="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
					/>
				</div>
			</div>
			<div>
				<label class={labelClass} for="contact-taxid">Tax ID / SST No.</label>
				<input id="contact-taxid" class={inputClass} type="text" bind:value={contactTaxId} placeholder="W10-1234-56789012" />
			</div>
		</div>
		{#if contactError}
			<p class="text-destructive text-xs mt-3">{contactError}</p>
		{/if}
		<div class="flex items-center gap-3 mt-4">
			<button
				onclick={saveContact}
				disabled={contactSaving}
				class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
			>
				{#if contactSaving}<Loader2 class="size-4 animate-spin inline mr-1.5" />{/if}
				Save
			</button>
			{#if contactSuccess}
				<span class="text-xs text-success-fg">Saved!</span>
			{/if}
		</div>
	</div>

	<!-- Logo -->
	<div class={sectionClass}>
		<h3 class="text-sm font-semibold text-foreground mb-4">Logo</h3>
		<p class="text-xs text-muted-foreground mb-4">Appears on printed receipts and emailed invoices. JPEG or PNG, max 2 MB.</p>

		<div class="flex items-center gap-4 mb-4">
			{#if logoPreview}
				<img src={logoPreview} alt="Business logo" class="h-16 w-16 rounded-md object-contain border border-border bg-muted/20" />
			{:else}
				<div class="h-16 w-16 rounded-md border border-dashed border-border flex items-center justify-center bg-muted/20">
					<ImageOff class="size-6 text-muted-foreground" />
				</div>
			{/if}
			<div class="flex-1 min-w-0">
				<input
					bind:this={logoInput}
					type="file"
					accept="image/jpeg,image/png"
					class="hidden"
					onchange={uploadLogo}
				/>
				<button
					onclick={() => logoInput.click()}
					disabled={logoUploading}
					class="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm text-foreground hover:bg-muted disabled:opacity-50"
				>
					{#if logoUploading}
						<Loader2 class="size-4 animate-spin" />
						Uploading…
					{:else}
						<Upload class="size-4" />
						{logoPreview ? 'Replace logo' : 'Upload logo'}
					{/if}
				</button>
				{#if logoError}
					<p class="text-destructive text-xs mt-2">{logoError}</p>
				{/if}
				{#if logoSuccess}
					<p class="text-xs text-green-600 mt-2">Logo updated!</p>
				{/if}
			</div>
		</div>
	</div>
	</div><!-- end right column -->
	</div><!-- end grid -->
</div>
