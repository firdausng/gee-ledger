<script lang="ts">
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import { api } from '$lib/client/api.svelte';
	import { toast } from 'svelte-sonner';
	import { Settings2, Loader2, Upload, ImageOff, Trash2 } from '@lucide/svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Separator } from '$lib/components/ui/separator';
	import CurrencyCombobox from '$lib/components/CurrencyCombobox.svelte';
	import { PHONE_CODES, parsePhone } from '$lib/data/phoneCodes';

	let { data } = $props();

	const businessId = $page.params.businessId!;
	const biz = $derived(data.business);

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

	const parsedPhone = parsePhone(biz.phone ?? '');
	let contactPhoneCode   = $state(parsedPhone.code);
	let contactPhoneNumber = $state(parsedPhone.number);
	let contactSaving  = $state(false);
	let contactError   = $state<string | null>(null);
	let contactSuccess = $state(false);

	// ── Company Details ─────────────────────────────────────────────
	let detailRegNo          = $state(biz.registrationNo ?? '');
	let detailVatNo          = $state(biz.vatNo ?? '');
	let detailWebsite        = $state(biz.website ?? '');
	let detailEmail          = $state(biz.email ?? '');
	let detailSize           = $state(biz.companySize ?? '');
	let detailIndustry       = $state(biz.industry ?? '');
	let detailClassification = $state(biz.classification ?? '');
	let detailSaving         = $state(false);
	let detailError          = $state<string | null>(null);
	let detailSuccess        = $state(false);

	const companySizes = ['1 - 3', '4 - 10', '11 - 50', '51 - 200', '201 - 500', '500+'];
	const industries = [
		'Accounting & Legal', 'Agriculture', 'Automotive', 'Construction', 'Consulting',
		'Education', 'Energy & Utilities', 'Entertainment & Media', 'Finance & Banking',
		'Food & Beverage', 'Healthcare', 'Hospitality & Tourism', 'Insurance',
		'Manufacturing', 'Non-Profit', 'Real Estate', 'Retail', 'Technology',
		'Telecommunications', 'Transportation & Logistics', 'Other'
	];

	// ── Logo ───────────────────────────────────────────────────────
	let logoInput: HTMLInputElement;
	let logoPreview    = $state<string | null>(biz.logoR2Key ? `/api/businesses/${businessId}/logo` : null);
	let logoUploading  = $state(false);
	let logoError      = $state<string | null>(null);
	let logoSuccess    = $state(false);

	// ── Delete ─────────────────────────────────────────────────────
	const isOwner = $derived(data.policyKey === 'owner');
	let deleting = $state(false);
	let deleteConfirmName = $state('');

	// ── Save handlers ──────────────────────────────────────────────
	async function saveInfo() {
		try {
			infoSaving = true;
			infoError = null;
			infoSuccess = false;
			await api.patch(`/businesses/${businessId}`, {
				name: infoName,
				description: infoDescription || undefined,
				currency: infoCurrency,
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
				phone: contactPhoneNumber.trim() ? `${contactPhoneCode}${contactPhoneNumber.trim()}` : undefined,
				taxId: contactTaxId || undefined,
			});
			contactSuccess = true;
			setTimeout(() => (contactSuccess = false), 3000);
		} catch (e) {
			contactError = e instanceof Error ? e.message : 'Failed to save';
		} finally {
			contactSaving = false;
		}
	}

	async function saveDetails() {
		try {
			detailSaving = true;
			detailError = null;
			detailSuccess = false;
			await api.patch(`/businesses/${businessId}`, {
				registrationNo: detailRegNo || undefined,
				vatNo: detailVatNo || undefined,
				website: detailWebsite || undefined,
				email: detailEmail || undefined,
				companySize: detailSize || undefined,
				industry: detailIndustry || undefined,
				classification: detailClassification || undefined,
			});
			detailSuccess = true;
			setTimeout(() => (detailSuccess = false), 3000);
		} catch (e) {
			detailError = e instanceof Error ? e.message : 'Failed to save';
		} finally {
			detailSaving = false;
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
			logoPreview = `/api/businesses/${businessId}/logo?t=${Date.now()}`;
			logoSuccess = true;
			setTimeout(() => (logoSuccess = false), 3000);
		} catch (e) {
			logoError = e instanceof Error ? e.message : 'Failed to upload';
		} finally {
			logoUploading = false;
		}
	}

	async function deleteBusiness() {
		try {
			deleting = true;
			await api.delete(`/businesses/${businessId}`);
			toast.success('Business deleted');
			await invalidateAll();
			goto('/businesses');
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to delete business');
		} finally {
			deleting = false;
		}
	}
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
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-sm">Business Info</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-2">
					<Label for="info-name">Name</Label>
					<Input id="info-name" type="text" bind:value={infoName} maxlength={100} />
				</div>
				<div class="space-y-2">
					<Label for="info-desc">Description</Label>
					<Textarea id="info-desc" bind:value={infoDescription} rows={2} class="resize-none" />
				</div>
				<div class="space-y-2">
					<Label>Currency</Label>
					<CurrencyCombobox bind:value={infoCurrency} />
				</div>
			</Card.Content>
			<Card.Footer class="flex items-center gap-3">
				<Button onclick={saveInfo} disabled={infoSaving} size="sm">
					{#if infoSaving}<Loader2 class="size-4 animate-spin" />{/if}
					Save
				</Button>
				{#if infoSuccess}
					<span class="text-xs text-success-fg">Saved!</span>
				{/if}
				{#if infoError}
					<span class="text-xs text-destructive">{infoError}</span>
				{/if}
			</Card.Footer>
		</Card.Root>

		<!-- Right column -->
		<div class="flex flex-col gap-4">
			<!-- Contact & Legal -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-sm">Contact & Legal</Card.Title>
					<Card.Description>Shown on invoices and receipts sent to customers.</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="space-y-2">
						<Label for="contact-address">Address</Label>
						<Textarea id="contact-address" bind:value={contactAddress} rows={3} class="resize-none" placeholder="123 Main St, City, Country" />
					</div>
					<div class="space-y-2">
						<Label for="contact-phone-number">Phone</Label>
						<div class="flex rounded-md border border-input bg-background focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring overflow-hidden shadow-xs">
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
					<div class="space-y-2">
						<Label for="contact-taxid">Tax ID / SST No.</Label>
						<Input id="contact-taxid" type="text" bind:value={contactTaxId} placeholder="W10-1234-56789012" />
					</div>
				</Card.Content>
				<Card.Footer class="flex items-center gap-3">
					<Button onclick={saveContact} disabled={contactSaving} size="sm">
						{#if contactSaving}<Loader2 class="size-4 animate-spin" />{/if}
						Save
					</Button>
					{#if contactSuccess}
						<span class="text-xs text-success-fg">Saved!</span>
					{/if}
					{#if contactError}
						<span class="text-xs text-destructive">{contactError}</span>
					{/if}
				</Card.Footer>
			</Card.Root>

			<!-- Logo -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-sm">Logo</Card.Title>
					<Card.Description>Appears on printed receipts and emailed invoices. JPEG or PNG, max 2 MB.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="flex items-center gap-4">
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
							<Button variant="outline" size="sm" onclick={() => logoInput.click()} disabled={logoUploading}>
								{#if logoUploading}
									<Loader2 class="size-4 animate-spin" />
									Uploading...
								{:else}
									<Upload class="size-4" />
									{logoPreview ? 'Replace logo' : 'Upload logo'}
								{/if}
							</Button>
							{#if logoError}
								<p class="text-destructive text-xs mt-2">{logoError}</p>
							{/if}
							{#if logoSuccess}
								<p class="text-xs text-success-fg mt-2">Logo updated!</p>
							{/if}
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</div>

	<!-- Company Details -->
	<Card.Root class="mt-4">
		<Card.Header>
			<Card.Title class="text-sm">Company Details</Card.Title>
			<Card.Description>Additional company information for compliance and identification.</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="detail-regno">ID / Registration No.</Label>
					<Input id="detail-regno" type="text" bind:value={detailRegNo} placeholder="e.g. 202401012345" />
				</div>
				<div class="space-y-2">
					<Label for="detail-vatno">VAT Number</Label>
					<Input id="detail-vatno" type="text" bind:value={detailVatNo} placeholder="e.g. GB123456789" />
				</div>
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="detail-website">Website</Label>
					<Input id="detail-website" type="url" bind:value={detailWebsite} placeholder="https://example.com" />
				</div>
				<div class="space-y-2">
					<Label for="detail-email">Email</Label>
					<Input id="detail-email" type="email" bind:value={detailEmail} placeholder="hello@example.com" />
				</div>
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label>Company Size</Label>
					<Select.Root type="single" bind:value={detailSize}>
						<Select.Trigger class="w-full">
							{detailSize || 'Select size'}
						</Select.Trigger>
						<Select.Content>
							{#each companySizes as size}
								<Select.Item value={size}>{size}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="space-y-2">
					<Label>Industry</Label>
					<Select.Root type="single" bind:value={detailIndustry}>
						<Select.Trigger class="w-full">
							{detailIndustry || 'Select industry'}
						</Select.Trigger>
						<Select.Content>
							{#each industries as ind}
								<Select.Item value={ind}>{ind}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>
			<div class="space-y-2">
				<Label for="detail-classification">Classification</Label>
				<Input id="detail-classification" type="text" bind:value={detailClassification} placeholder="e.g. Sole Proprietorship, LLC, Sdn Bhd" />
			</div>
		</Card.Content>
		<Card.Footer class="flex items-center gap-3">
			<Button onclick={saveDetails} disabled={detailSaving} size="sm">
				{#if detailSaving}<Loader2 class="size-4 animate-spin" />{/if}
				Save
			</Button>
			{#if detailSuccess}
				<span class="text-xs text-success-fg">Saved!</span>
			{/if}
			{#if detailError}
				<span class="text-xs text-destructive">{detailError}</span>
			{/if}
		</Card.Footer>
	</Card.Root>

	<!-- Danger Zone -->
	{#if isOwner}
		<Card.Root class="mt-4 border-destructive/30">
			<Card.Header>
				<Card.Title class="text-sm text-destructive">Danger Zone</Card.Title>
				<Card.Description>
					Deleting this business will permanently remove all its transactions, accounts, contacts, and other data. This action cannot be undone.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<AlertDialog.Root onOpenChange={() => (deleteConfirmName = '')}>
					<AlertDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" size="sm" {...props} class="border-destructive/30 text-destructive hover:bg-destructive/10">
								<Trash2 class="size-4" />
								Delete Business
							</Button>
						{/snippet}
					</AlertDialog.Trigger>
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Title>Delete {biz.name}?</AlertDialog.Title>
							<AlertDialog.Description>
								This will permanently delete all transactions, accounts, contacts, categories, locations, channels, and attachments associated with this business.
							</AlertDialog.Description>
						</AlertDialog.Header>
						<div class="py-2 space-y-2">
							<Label>
								Type <span class="font-semibold">{biz.name}</span> to confirm
							</Label>
							<Input type="text" bind:value={deleteConfirmName} placeholder={biz.name} />
						</div>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
							<Button
								variant="destructive"
								onclick={deleteBusiness}
								disabled={deleting || deleteConfirmName !== biz.name}
							>
								{#if deleting}<Loader2 class="size-4 animate-spin" />{/if}
								Delete permanently
							</Button>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
