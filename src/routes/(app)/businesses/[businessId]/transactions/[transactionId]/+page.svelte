<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api, formatAmount } from '$lib/client/api.svelte';
	import { channelMeta, type ChannelType } from '$lib/client/channelMeta';
	import {
		ArrowLeft,
		Pencil,
		Loader2,
		Paperclip,
		Download,
		FileImage,
		FileText,
		MapPin,
		Tag,
		Hash
	} from '@lucide/svelte';

	let { data } = $props();

	type Location = { id: string; name: string; type: string };
	type Channel  = { id: string; name: string; type: string };
	type Category = { id: string; name: string; type: string };
	type Transaction = {
		id: string;
		type: 'income' | 'expense' | 'transfer';
		transactionDate: string;
		amount: number;
		locationId: string;
		salesChannelId: string | null;
		categoryId: string | null;
		note: string | null;
		referenceNo: string | null;
	};
	type Attachment = {
		id: string;
		fileName: string;
		mimeType: string;
		fileSize: number;
		createdAt: string;
	};

	const businessId     = $page.params.businessId;
	const transactionId  = $page.params.transactionId;

	let tx          = $state<Transaction | null>(null);
	let locations   = $state<Location[]>([]);
	let channels    = $state<Channel[]>([]);
	let categories  = $state<Category[]>([]);
	let attachments = $state<Attachment[]>([]);
	let loading     = $state(true);
	let error       = $state<string | null>(null);

	let location = $derived(locations.find((l) => l.id === tx?.locationId) ?? null);
	let channel  = $derived(channels.find((c) => c.id === tx?.salesChannelId) ?? null);
	let category = $derived(categories.find((c) => c.id === tx?.categoryId) ?? null);

	function formatFileSize(bytes: number): string {
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function downloadUrl(id: string) {
		return `/api/businesses/${businessId}/attachments/${id}/download`;
	}

	async function load() {
		try {
			loading = true;
			error = null;
			const [locs, chans, cats, transaction, atts] = await Promise.all([
				api.get<Location[]>(`/businesses/${businessId}/locations`),
				api.get<Channel[]>(`/businesses/${businessId}/channels`),
				api.get<Category[]>(`/businesses/${businessId}/categories`),
				api.get<Transaction>(`/businesses/${businessId}/transactions/${transactionId}`),
				api.get<Attachment[]>(`/businesses/${businessId}/transactions/${transactionId}/attachments`)
			]);
			locations   = locs;
			channels    = chans;
			categories  = cats;
			tx          = transaction;
			attachments = atts;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load transaction';
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<div class="max-w-lg">
	<div class="flex items-center justify-between mb-5">
		<a
			href="/businesses/{businessId}/transactions"
			class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
		>
			<ArrowLeft class="size-3.5" />
			Back
		</a>
		{#if tx}
			<a
				href="/businesses/{businessId}/transactions/{transactionId}/edit"
				class="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
			>
				<Pencil class="size-3.5" />
				Edit
			</a>
		{/if}
	</div>

	{#if loading}
		<div class="flex justify-center py-16">
			<Loader2 class="size-7 animate-spin text-muted-foreground" />
		</div>
	{:else if error}
		<div class="p-4 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
	{:else if tx}
		<!-- Amount + type header -->
		<div class="rounded-lg border border-border bg-card p-5 mb-4">
			<div class="flex items-start justify-between gap-3">
				<div>
					<span
						class="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2
							{tx.type === 'income'   ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
							 tx.type === 'expense'  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
							 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}"
					>
						{tx.type}
					</span>
					<p
						class="text-2xl font-bold
							{tx.type === 'income'  ? 'text-green-600' :
							 tx.type === 'expense' ? 'text-red-600'   : 'text-foreground'}"
					>
						{tx.type === 'expense' ? '−' : '+'}{formatAmount(tx.amount, data.business.currency)}
					</p>
				</div>
				<p class="text-sm text-muted-foreground mt-1 shrink-0">{tx.transactionDate}</p>
			</div>

			{#if tx.note}
				<p class="text-sm text-foreground mt-3">{tx.note}</p>
			{/if}
		</div>

		<!-- Detail rows -->
		<div class="rounded-lg border border-border bg-card overflow-hidden mb-4">
			<!-- Location -->
			<div class="flex items-center gap-3 px-4 py-3 border-b border-border">
				<MapPin class="size-4 text-muted-foreground shrink-0" />
				<span class="text-sm text-muted-foreground w-24 shrink-0">Location</span>
				<span class="text-sm text-foreground">{location?.name ?? '—'}</span>
			</div>

			<!-- Channel -->
			{#if tx.type !== 'transfer'}
				<div class="flex items-center gap-3 px-4 py-3 border-b border-border">
					{#if channel}
						{@const meta = channelMeta[channel.type as ChannelType] ?? channelMeta['custom']}
						<svelte:component this={meta.icon} class="size-4 text-muted-foreground shrink-0" />
						<span class="text-sm text-muted-foreground w-24 shrink-0">Channel</span>
						<span class="text-sm text-foreground">{channel.name}</span>
						<span class="ml-auto text-xs text-muted-foreground">{meta.label}</span>
					{:else}
						<Paperclip class="size-4 text-muted-foreground shrink-0" />
						<span class="text-sm text-muted-foreground w-24 shrink-0">Channel</span>
						<span class="text-sm text-muted-foreground">—</span>
					{/if}
				</div>
			{/if}

			<!-- Category -->
			{#if category}
				<div class="flex items-center gap-3 px-4 py-3 border-b border-border">
					<Tag class="size-4 text-muted-foreground shrink-0" />
					<span class="text-sm text-muted-foreground w-24 shrink-0">Category</span>
					<span class="text-sm text-foreground">{category.name}</span>
				</div>
			{/if}

			<!-- Reference No -->
			{#if tx.referenceNo}
				<div class="flex items-center gap-3 px-4 py-3">
					<Hash class="size-4 text-muted-foreground shrink-0" />
					<span class="text-sm text-muted-foreground w-24 shrink-0">Ref. No.</span>
					<span class="text-sm text-foreground font-mono">{tx.referenceNo}</span>
				</div>
			{/if}
		</div>

		<!-- Attachments -->
		{#if attachments.length > 0}
			<div class="rounded-lg border border-border bg-card overflow-hidden">
				<div class="flex items-center gap-2 px-4 py-3 border-b border-border">
					<Paperclip class="size-4 text-muted-foreground" />
					<span class="text-sm font-medium text-foreground">Attachments</span>
					<span class="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground ml-auto">
						{attachments.length}
					</span>
				</div>
				{#each attachments as att (att.id)}
					<div class="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 bg-card">
						{#if att.mimeType === 'application/pdf'}
							<FileText class="size-4 text-red-500 shrink-0" />
						{:else}
							<FileImage class="size-4 text-blue-500 shrink-0" />
						{/if}
						<div class="flex-1 min-w-0">
							<p class="text-sm text-foreground truncate">{att.fileName}</p>
							<p class="text-xs text-muted-foreground">{formatFileSize(att.fileSize)}</p>
						</div>
						<a
							href={downloadUrl(att.id)}
							target="_blank"
							rel="noopener noreferrer"
							class="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
							title="Download"
						>
							<Download class="size-3.5" />
						</a>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
