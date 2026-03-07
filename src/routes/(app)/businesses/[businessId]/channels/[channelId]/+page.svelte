<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/client/api.svelte';
	import { CHANNEL_TYPES, channelMeta, type ChannelType } from '$lib/client/channelMeta';
	import { ArrowLeft, Loader2 } from '@lucide/svelte';

	type Channel = {
		id: string;
		name: string;
		type: string;
		isActive: boolean;
	};

	const businessId = $page.params.businessId!;
	const channelId = $page.params.channelId!;

	let channel = $state<Channel | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let editName = $state('');
	let editType = $state<ChannelType>('custom');
	let saving = $state(false);
	let saveError = $state<string | null>(null);
	let saveSuccess = $state(false);

	function populateFields(ch: Channel) {
		editName = ch.name;
		editType = ch.type as ChannelType;
	}

	const hasChanges = $derived.by(() => {
		if (!channel) return false;
		return editName.trim() !== channel.name || editType !== channel.type;
	});

	async function save() {
		if (!editName.trim()) return;
		try {
			saving = true;
			saveError = null;
			saveSuccess = false;
			channel = await api.patch<Channel>(`/businesses/${businessId}/channels/${channelId}`, {
				name: editName.trim(),
				type: editType
			});
			populateFields(channel);
			saveSuccess = true;
			setTimeout(() => (saveSuccess = false), 2000);
		} catch (e) {
			saveError = e instanceof Error ? e.message : 'Failed to update';
		} finally {
			saving = false;
		}
	}

	function discard() {
		if (channel) populateFields(channel);
		saveError = null;
	}

	async function load() {
		try {
			loading = true;
			error = null;
			const ch = await api.get<Channel>(`/businesses/${businessId}/channels/${channelId}`);
			channel = ch;
			populateFields(ch);
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
	{:else if error && !channel}
		<p class="text-destructive text-sm text-center py-8">{error}</p>
	{:else if channel}
		<div class="flex items-center gap-2 mb-4">
			<a href="/businesses/{businessId}/channels" class="p-1 rounded text-muted-foreground hover:text-foreground shrink-0">
				<ArrowLeft class="size-4" />
			</a>
			<h2 class="text-lg font-semibold text-foreground">Channel Details</h2>
		</div>

		<div class="rounded-lg border border-border bg-card p-4">
			{#if saveError}<p class="text-destructive text-sm mb-3">{saveError}</p>{/if}
			<div class="flex flex-col gap-3">
				<div>
					<label for="ch-name" class="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
					<input id="ch-name" type="text" bind:value={editName} placeholder="Channel name"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
				</div>
				<div>
					<label class="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
					<div class="grid grid-cols-5 gap-1.5">
						{#each CHANNEL_TYPES as t}
							{@const meta = channelMeta[t]}
							<button
								type="button"
								onclick={() => (editType = t)}
								class="flex flex-col items-center gap-1 px-1 py-2 rounded-md border text-xs font-medium transition-colors
									{editType === t
									? 'border-primary bg-primary/10 text-primary'
									: 'border-input text-muted-foreground hover:border-muted-foreground hover:text-foreground'}"
								title={meta.label}
							>
								<meta.icon class="size-4 shrink-0" />
								<span class="truncate w-full text-center">{meta.label}</span>
							</button>
						{/each}
					</div>
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
