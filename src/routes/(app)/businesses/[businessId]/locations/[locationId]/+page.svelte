<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/client/api.svelte';
	import { ArrowLeft, Loader2, MapPin } from '@lucide/svelte';
	import AddressInput from '$lib/components/AddressInput.svelte';

	type Location = {
		id: string;
		name: string;
		type: string;
		addressLine1: string | null;
		addressLine2: string | null;
		addressCity: string | null;
		addressState: string | null;
		addressPostalCode: string | null;
		addressCountry: string | null;
		isActive: boolean;
	};

	const businessId = $page.params.businessId!;
	const locationId = $page.params.locationId!;
	const LOCATION_TYPES = ['hq', 'branch', 'warehouse', 'online'] as const;

	let location = $state<Location | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let editName = $state('');
	let editType = $state('');
	let editAddrLine1 = $state('');
	let editAddrLine2 = $state('');
	let editAddrCity = $state('');
	let editAddrState = $state('');
	let editAddrPostalCode = $state('');
	let editAddrCountry = $state('');
	let saving = $state(false);
	let saveError = $state<string | null>(null);
	let saveSuccess = $state(false);

	function populateFields(loc: Location) {
		editName = loc.name;
		editType = loc.type;
		editAddrLine1 = loc.addressLine1 ?? '';
		editAddrLine2 = loc.addressLine2 ?? '';
		editAddrCity = loc.addressCity ?? '';
		editAddrState = loc.addressState ?? '';
		editAddrPostalCode = loc.addressPostalCode ?? '';
		editAddrCountry = loc.addressCountry ?? '';
	}

	const hasChanges = $derived.by(() => {
		if (!location) return false;
		return (
			editName.trim() !== location.name ||
			editType !== location.type ||
			(editAddrLine1.trim() || null) !== (location.addressLine1 || null) ||
			(editAddrLine2.trim() || null) !== (location.addressLine2 || null) ||
			(editAddrCity.trim() || null) !== (location.addressCity || null) ||
			(editAddrState.trim() || null) !== (location.addressState || null) ||
			(editAddrPostalCode.trim() || null) !== (location.addressPostalCode || null) ||
			(editAddrCountry.trim() || null) !== (location.addressCountry || null)
		);
	});

	async function save() {
		if (!editName.trim()) return;
		try {
			saving = true;
			saveError = null;
			saveSuccess = false;
			location = await api.patch<Location>(`/businesses/${businessId}/locations/${locationId}`, {
				name: editName.trim(),
				type: editType,
				addressLine1: editAddrLine1.trim() || undefined,
				addressLine2: editAddrLine2.trim() || undefined,
				addressCity: editAddrCity.trim() || undefined,
				addressState: editAddrState.trim() || undefined,
				addressPostalCode: editAddrPostalCode.trim() || undefined,
				addressCountry: editAddrCountry.trim() || undefined
			});
			populateFields(location);
			saveSuccess = true;
			setTimeout(() => (saveSuccess = false), 2000);
		} catch (e) {
			saveError = e instanceof Error ? e.message : 'Failed to update';
		} finally {
			saving = false;
		}
	}

	function discard() {
		if (location) populateFields(location);
		saveError = null;
	}

	async function load() {
		try {
			loading = true;
			error = null;
			const loc = await api.get<Location>(`/businesses/${businessId}/locations/${locationId}`);
			location = loc;
			populateFields(loc);
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
	{:else if error && !location}
		<p class="text-destructive text-sm text-center py-8">{error}</p>
	{:else if location}
		<div class="flex items-center gap-2 mb-4">
			<a href="/businesses/{businessId}/locations" class="p-1 rounded text-muted-foreground hover:text-foreground shrink-0">
				<ArrowLeft class="size-4" />
			</a>
			<h2 class="text-lg font-semibold text-foreground">Location Details</h2>
		</div>

		<div class="rounded-lg border border-border bg-card p-4">
			{#if saveError}<p class="text-destructive text-sm mb-3">{saveError}</p>{/if}
			<div class="flex flex-col gap-3">
				<div>
					<label for="loc-name" class="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
					<input id="loc-name" type="text" bind:value={editName} placeholder="Location name"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
				</div>
				<div>
					<label for="loc-type" class="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
					<select id="loc-type" bind:value={editType}
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
						{#each LOCATION_TYPES as t}
							<option value={t}>{t}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="text-xs font-medium text-muted-foreground mb-1 block">Address</label>
					<AddressInput bind:line1={editAddrLine1} bind:line2={editAddrLine2} bind:city={editAddrCity} bind:region={editAddrState} bind:postalCode={editAddrPostalCode} bind:country={editAddrCountry} />
				</div>
				{#if hasChanges}
					<div class="flex items-center gap-2 justify-end pt-1">
						<button onclick={discard} class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted">Discard</button>
						<button onclick={save} disabled={saving || !editName.trim()}
							class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
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
	{/if}
</div>
