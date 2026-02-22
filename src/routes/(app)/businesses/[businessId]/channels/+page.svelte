<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/client/api.svelte';
	import { CHANNEL_TYPES, channelMeta, type ChannelType } from '$lib/client/channelMeta';
	import { Plus, Loader2, Pencil, Trash2 } from '@lucide/svelte';

	type Channel = {
		id: string;
		name: string;
		type: string;
		isActive: boolean;
	};

	const businessId = $page.params.businessId;

	let channels = $state<Channel[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Create form
	let showCreate = $state(false);
	let createName = $state('');
	let createType = $state<ChannelType>('custom');
	let creating = $state(false);
	let createError = $state<string | null>(null);

	// Edit
	let editId = $state<string | null>(null);
	let editName = $state('');
	let editType = $state<ChannelType>('custom');
	let editing = $state(false);
	let editError = $state<string | null>(null);

	// Delete
	let deleteId = $state<string | null>(null);
	let deleting = $state(false);

	async function load() {
		try {
			loading = true;
			error = null;
			channels = await api.get<Channel[]>(`/businesses/${businessId}/channels`);
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
			const ch = await api.post<Channel>(`/businesses/${businessId}/channels`, {
				name: createName.trim(),
				type: createType
			});
			channels = [...channels, ch];
			showCreate = false;
			createName = '';
			createType = 'custom';
		} catch (e) {
			createError = e instanceof Error ? e.message : 'Failed to create';
		} finally {
			creating = false;
		}
	}

	function startEdit(ch: Channel) {
		editId = ch.id;
		editName = ch.name;
		editType = ch.type as ChannelType;
		editError = null;
	}

	async function saveEdit() {
		if (!editId || !editName.trim()) return;
		try {
			editing = true;
			editError = null;
			const updated = await api.patch<Channel>(`/businesses/${businessId}/channels/${editId}`, {
				name: editName.trim(),
				type: editType
			});
			channels = channels.map((c) => (c.id === editId ? updated : c));
			editId = null;
		} catch (e) {
			editError = e instanceof Error ? e.message : 'Failed to update';
		} finally {
			editing = false;
		}
	}

	async function deleteChannel(id: string) {
		try {
			deleting = true;
			await api.delete(`/businesses/${businessId}/channels/${id}`);
			channels = channels.filter((c) => c.id !== id);
			deleteId = null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete';
		} finally {
			deleting = false;
		}
	}

	onMount(load);
</script>

<div class="max-w-2xl">
	<div class="flex items-center justify-between mb-4">
		<h2 class="font-semibold text-foreground">Sales Channels</h2>
		<button
			onclick={() => { showCreate = !showCreate; createError = null; }}
			class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
		>
			<Plus class="size-4" />
			Add Channel
		</button>
	</div>

	{#if showCreate}
		<div class="rounded-lg border border-border bg-card p-4 mb-4">
			<h3 class="text-sm font-semibold mb-3">New Sales Channel</h3>
			{#if createError}
				<p class="text-destructive text-sm mb-2">{createError}</p>
			{/if}
			<div class="flex flex-col gap-3">
				<input
					type="text"
					bind:value={createName}
					placeholder="Channel name"
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
				<!-- Type picker -->
				<div class="grid grid-cols-5 gap-1.5">
					{#each CHANNEL_TYPES as t}
						{@const meta = channelMeta[t]}
						<button
							type="button"
							onclick={() => (createType = t)}
							class="flex flex-col items-center gap-1 px-1 py-2 rounded-md border text-xs font-medium transition-colors
								{createType === t
								? 'border-primary bg-primary/10 text-primary'
								: 'border-input text-muted-foreground hover:border-muted-foreground hover:text-foreground'}"
							title={meta.label}
						>
							<svelte:component this={meta.icon} class="size-4 shrink-0" />
							<span class="truncate w-full text-center">{meta.label}</span>
						</button>
					{/each}
				</div>
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
	{:else if channels.length === 0}
		{@const meta = channelMeta['custom']}
		<div class="rounded-lg border border-border bg-card p-10 text-center">
			<svelte:component this={meta.icon} class="size-8 text-muted-foreground mx-auto mb-2" />
			<p class="text-muted-foreground text-sm">No sales channels yet.</p>
		</div>
	{:else}
		<div class="rounded-lg border border-border overflow-hidden">
			{#each channels as ch (ch.id)}
				{@const meta = channelMeta[ch.type as ChannelType] ?? channelMeta['custom']}
				{#if editId === ch.id}
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
							<!-- Type picker -->
							<div class="grid grid-cols-5 gap-1.5">
								{#each CHANNEL_TYPES as t}
									{@const m = channelMeta[t]}
									<button
										type="button"
										onclick={() => (editType = t)}
										class="flex flex-col items-center gap-1 px-1 py-2 rounded-md border text-xs font-medium transition-colors
											{editType === t
											? 'border-primary bg-primary/10 text-primary'
											: 'border-input text-muted-foreground hover:border-muted-foreground hover:text-foreground'}"
										title={m.label}
									>
										<svelte:component this={m.icon} class="size-4 shrink-0" />
										<span class="truncate w-full text-center">{m.label}</span>
									</button>
								{/each}
							</div>
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
						<svelte:component this={meta.icon} class="size-4 text-muted-foreground shrink-0" />
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-foreground">{ch.name}</p>
						</div>
						<span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
							{meta.label}
						</span>
						<div class="flex items-center gap-1 shrink-0">
							<button
								onclick={() => startEdit(ch)}
								class="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
							>
								<Pencil class="size-3.5" />
							</button>
							<button
								onclick={() => (deleteId = ch.id)}
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
			<h3 class="font-semibold text-foreground mb-2">Delete Channel?</h3>
			<p class="text-sm text-muted-foreground mb-5">This action cannot be undone.</p>
			<div class="flex justify-end gap-2">
				<button
					onclick={() => (deleteId = null)}
					class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
				>
					Cancel
				</button>
				<button
					onclick={() => deleteChannel(deleteId!)}
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
