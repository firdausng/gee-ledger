<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api, formatAmount } from '$lib/client/api.svelte';
	import { Loader2, Paperclip, FileImage, FileText, Download, Trash2, AlertTriangle } from '@lucide/svelte';

	type Attachment = {
		id: string;
		fileName: string;
		mimeType: string;
		fileSize: number;
		createdAt: string;
		transactionId: string | null;
		transactionDate: string | null;
		transactionType: string | null;
		transactionAmount: number | null;
		transactionNote: string | null;
	};

	let { data } = $props();
	const businessId = $page.params.businessId;

	let all = $state<Attachment[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let deletingId = $state<string | null>(null);

	let linked = $derived(all.filter((a) => a.transactionId !== null));
	let orphaned = $derived(all.filter((a) => a.transactionId === null));

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
			all = await api.get<Attachment[]>(`/businesses/${businessId}/attachments`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load attachments';
		} finally {
			loading = false;
		}
	}

	async function deleteAttachment(id: string) {
		try {
			deletingId = id;
			await api.delete(`/businesses/${businessId}/attachments/${id}`);
			all = all.filter((a) => a.id !== id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete attachment';
		} finally {
			deletingId = null;
		}
	}

	onMount(load);
</script>

<div class="max-w-3xl">
	<div class="flex items-center gap-2 mb-6">
		<Paperclip class="size-5 text-muted-foreground" />
		<div>
			<h2 class="font-semibold text-foreground">Attachments</h2>
			<p class="text-xs text-muted-foreground mt-0.5">All files uploaded for this business</p>
		</div>
	</div>

	{#if loading}
		<div class="flex justify-center py-16">
			<Loader2 class="size-7 animate-spin text-muted-foreground" />
		</div>
	{:else if error}
		<p class="text-destructive text-sm py-8 text-center">{error}</p>
	{:else if all.length === 0}
		<div class="rounded-lg border border-border bg-card p-10 text-center">
			<Paperclip class="size-8 text-muted-foreground mx-auto mb-3" />
			<p class="text-muted-foreground text-sm">No attachments yet.</p>
		</div>
	{:else}
		<!-- Orphaned files -->
		{#if orphaned.length > 0}
			<div class="mb-6">
				<div class="flex items-center gap-2 mb-2">
					<AlertTriangle class="size-4 text-amber-500" />
					<h3 class="text-sm font-medium text-foreground">
						Unlinked files
						<span class="text-muted-foreground font-normal">({orphaned.length})</span>
					</h3>
				</div>
				<p class="text-xs text-muted-foreground mb-3">
					These files were uploaded but not saved to a transaction. You can delete them to free up storage.
				</p>
				<div class="rounded-lg border border-amber-200 dark:border-amber-900/40 overflow-hidden">
					{#each orphaned as att (att.id)}
						<div class="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 bg-amber-50/50 dark:bg-amber-900/10">
							{#if att.mimeType === 'application/pdf'}
								<FileText class="size-4 text-red-500 shrink-0" />
							{:else if att.mimeType.startsWith('image/')}
								<img
									src={downloadUrl(att.id)}
									alt={att.fileName}
									class="h-10 w-10 rounded object-cover border border-border shrink-0"
								/>
							{:else}
								<FileImage class="size-4 text-blue-500 shrink-0" />
							{/if}
							<div class="flex-1 min-w-0">
								<p class="text-sm text-foreground truncate">{att.fileName}</p>
								<p class="text-xs text-muted-foreground">{formatFileSize(att.fileSize)} · uploaded {new Date(att.createdAt).toLocaleDateString()}</p>
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
							<button
								onclick={() => deleteAttachment(att.id)}
								disabled={deletingId === att.id}
								class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 disabled:opacity-50"
								title="Delete"
							>
								{#if deletingId === att.id}
									<Loader2 class="size-3.5 animate-spin" />
								{:else}
									<Trash2 class="size-3.5" />
								{/if}
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Linked files -->
		{#if linked.length > 0}
			<div>
				<h3 class="text-sm font-medium text-foreground mb-2">
					Linked files
					<span class="text-muted-foreground font-normal">({linked.length})</span>
				</h3>
				<div class="rounded-lg border border-border overflow-hidden">
					{#each linked as att (att.id)}
						<div class="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 bg-card hover:bg-muted/30 transition-colors">
							{#if att.mimeType === 'application/pdf'}
								<FileText class="size-4 text-red-500 shrink-0" />
							{:else if att.mimeType.startsWith('image/')}
								<img
									src={downloadUrl(att.id)}
									alt={att.fileName}
									class="h-10 w-10 rounded object-cover border border-border shrink-0"
								/>
							{:else}
								<FileImage class="size-4 text-blue-500 shrink-0" />
							{/if}
							<div class="flex-1 min-w-0">
								<p class="text-sm text-foreground truncate">{att.fileName}</p>
								<p class="text-xs text-muted-foreground">{formatFileSize(att.fileSize)}</p>
							</div>
							<!-- Linked transaction info -->
							<a
								href="/businesses/{businessId}/transactions/{att.transactionId}/edit"
								class="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors shrink-0"
							>
								<span class="px-1.5 py-0.5 rounded-full
									{att.transactionType === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
									 att.transactionType === 'expense' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
									 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}">
									{att.transactionType}
								</span>
								<span>{att.transactionDate}</span>
								{#if att.transactionNote}
									<span class="truncate max-w-[8rem]">{att.transactionNote}</span>
								{/if}
							</a>
							<a
								href={downloadUrl(att.id)}
								target="_blank"
								rel="noopener noreferrer"
								class="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
								title="Download"
							>
								<Download class="size-3.5" />
							</a>
							<button
								onclick={() => deleteAttachment(att.id)}
								disabled={deletingId === att.id}
								class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 disabled:opacity-50"
								title="Delete"
							>
								{#if deletingId === att.id}
									<Loader2 class="size-3.5 animate-spin" />
								{:else}
									<Trash2 class="size-3.5" />
								{/if}
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
