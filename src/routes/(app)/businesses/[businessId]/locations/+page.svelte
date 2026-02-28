<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/client/api.svelte';
	import { Plus, Loader2, Pencil, Trash2, MapPin } from '@lucide/svelte';

	type Location = {
		id: string;
		name: string;
		type: string;
		address: string | null;
		isActive: boolean;
	};

	const businessId = $page.params.businessId!;

	const LOCATION_TYPES = ['hq', 'branch', 'warehouse', 'online'] as const;

	let locations = $state<Location[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Create form
	let showCreate = $state(false);
	let createName = $state('');
	let createType = $state<string>('branch');
	let createAddress = $state('');
	let creating = $state(false);
	let createError = $state<string | null>(null);

	// Edit
	let editId = $state<string | null>(null);
	let editName = $state('');
	let editType = $state('');
	let editAddress = $state('');
	let editing = $state(false);
	let editError = $state<string | null>(null);

	// Delete
	let deleteId = $state<string | null>(null);
	let deleting = $state(false);

	async function load() {
		try {
			loading = true;
			error = null;
			locations = await api.get<Location[]>(`/businesses/${businessId}/locations`);
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
			const loc = await api.post<Location>(`/businesses/${businessId}/locations`, {
				name: createName.trim(),
				type: createType,
				address: createAddress.trim() || undefined
			});
			locations = [...locations, loc];
			showCreate = false;
			createName = '';
			createType = 'branch';
			createAddress = '';
		} catch (e) {
			createError = e instanceof Error ? e.message : 'Failed to create';
		} finally {
			creating = false;
		}
	}

	function startEdit(loc: Location) {
		editId = loc.id;
		editName = loc.name;
		editType = loc.type;
		editAddress = loc.address ?? '';
		editError = null;
	}

	async function saveEdit() {
		if (!editId || !editName.trim()) return;
		try {
			editing = true;
			editError = null;
			const updated = await api.patch<Location>(`/businesses/${businessId}/locations/${editId}`, {
				name: editName.trim(),
				type: editType,
				address: editAddress.trim() || undefined
			});
			locations = locations.map((l) => (l.id === editId ? updated : l));
			editId = null;
		} catch (e) {
			editError = e instanceof Error ? e.message : 'Failed to update';
		} finally {
			editing = false;
		}
	}

	async function deleteLocation(id: string) {
		try {
			deleting = true;
			await api.delete(`/businesses/${businessId}/locations/${id}`);
			locations = locations.filter((l) => l.id !== id);
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
		<h2 class="font-semibold text-foreground">Locations</h2>
		<button
			onclick={() => { showCreate = !showCreate; createError = null; }}
			class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
		>
			<Plus class="size-4" />
			Add Location
		</button>
	</div>

	{#if showCreate}
		<div class="rounded-lg border border-border bg-card p-4 mb-4">
			<h3 class="text-sm font-semibold mb-3">New Location</h3>
			{#if createError}
				<p class="text-destructive text-sm mb-2">{createError}</p>
			{/if}
			<div class="flex flex-col gap-3">
				<input
					type="text"
					bind:value={createName}
					placeholder="Location name"
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
				<select
					bind:value={createType}
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				>
					{#each LOCATION_TYPES as t}
						<option value={t}>{t}</option>
					{/each}
				</select>
				<input
					type="text"
					bind:value={createAddress}
					placeholder="Address (optional)"
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
				<div class="flex justify-end gap-2">
					<button
						onclick={() => { showCreate = false; createError = null; }}
						class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
					>
						Cancel
					</button>
					<button
						onclick={create}
						disabled={creating || !createName.trim()}
						class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
					>
						{#if creating}<Loader2 class="size-4 animate-spin" />{/if}
						Create
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if error}
		<p class="text-destructive text-sm mb-4">{error}</p>
	{/if}

	{#if loading}
		<div class="flex justify-center py-12">
			<Loader2 class="size-7 animate-spin text-muted-foreground" />
		</div>
	{:else if locations.length === 0}
		<div class="rounded-lg border border-border bg-card p-10 text-center">
			<MapPin class="size-8 text-muted-foreground mx-auto mb-2" />
			<p class="text-muted-foreground text-sm">No locations yet.</p>
		</div>
	{:else}
		<div class="rounded-lg border border-border overflow-hidden">
			{#each locations as loc (loc.id)}
				{#if editId === loc.id}
					<div class="p-4 border-b border-border last:border-0 bg-muted/30">
						{#if editError}
							<p class="text-destructive text-sm mb-2">{editError}</p>
						{/if}
						<div class="flex flex-col gap-2">
							<input
								type="text"
								bind:value={editName}
								class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							/>
							<select
								bind:value={editType}
								class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							>
								{#each LOCATION_TYPES as t}
									<option value={t}>{t}</option>
								{/each}
							</select>
							<input
								type="text"
								bind:value={editAddress}
								placeholder="Address (optional)"
								class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							/>
							<div class="flex justify-end gap-2">
								<button
									onclick={() => (editId = null)}
									class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
								>
									Cancel
								</button>
								<button
									onclick={saveEdit}
									disabled={editing || !editName.trim()}
									class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
								>
									{#if editing}<Loader2 class="size-4 animate-spin" />{/if}
									Save
								</button>
							</div>
						</div>
					</div>
				{:else}
					<div class="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 bg-card hover:bg-muted/30 transition-colors">
						<MapPin class="size-4 text-muted-foreground shrink-0" />
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-foreground">{loc.name}</p>
							{#if loc.address}
								<p class="text-xs text-muted-foreground truncate">{loc.address}</p>
							{/if}
						</div>
						<span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize shrink-0">
							{loc.type}
						</span>
						<div class="flex items-center gap-1 shrink-0">
							<button
								onclick={() => startEdit(loc)}
								class="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
							>
								<Pencil class="size-3.5" />
							</button>
							<button
								onclick={() => (deleteId = loc.id)}
								class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
							>
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
			<h3 class="font-semibold text-foreground mb-2">Delete Location?</h3>
			<p class="text-sm text-muted-foreground mb-5">This action cannot be undone.</p>
			<div class="flex justify-end gap-2">
				<button
					onclick={() => (deleteId = null)}
					class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
				>
					Cancel
				</button>
				<button
					onclick={() => deleteLocation(deleteId!)}
					disabled={deleting}
					class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50"
				>
					{#if deleting}<Loader2 class="size-4 animate-spin" />{/if}
					Delete
				</button>
			</div>
		</div>
	</div>
{/if}
