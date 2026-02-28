<script lang="ts">
	import { X, Plus, GripVertical, Pencil, Paperclip, FileText, Loader2, Crown } from '@lucide/svelte';
	import { api } from '$lib/client/api.svelte';

	type ItemAttachment = { id: string; fileName: string; mimeType: string };
	type ServiceItem = {
		description: string;
		hours: number;
		rate: string;
		attachments: ItemAttachment[];
	};

	let {
		items = $bindable<ServiceItem[]>([]),
		businessId,
		canUploadAttachment = true
	}: { items: ServiceItem[]; businessId: string; canUploadAttachment?: boolean } = $props();

	let dragIndex = $state<number | null>(null);

	// ── Modal state ────────────────────────────────────────────────────────────
	let modalOpen  = $state(false);
	let editingIdx = $state<number | null>(null);
	let modalItem  = $state<{ description: string; hours: number; rate: string; attachments: ItemAttachment[] }>({
		description: '', hours: 1, rate: '0.00', attachments: []
	});
	let uploading   = $state(false);
	let uploadError = $state<string | null>(null);
	let fileInputEl = $state<HTMLInputElement | null>(null);

	function rowAmount(item: { hours: number; rate: string }): number {
		return (parseFloat(item.rate) || 0) * item.hours;
	}

	const grandTotal = $derived(items.reduce((sum, i) => sum + rowAmount(i), 0));

	function isImage(mimeType: string): boolean {
		return mimeType.startsWith('image/');
	}

	function downloadUrl(attachmentId: string): string {
		return `/api/businesses/${businessId}/attachments/${attachmentId}/download`;
	}

	function openNew() {
		editingIdx  = null;
		modalItem   = { description: '', hours: 1, rate: '0.00', attachments: [] };
		uploadError = null;
		modalOpen   = true;
	}

	function openEdit(idx: number) {
		editingIdx  = idx;
		modalItem   = { ...items[idx], attachments: [...(items[idx].attachments ?? [])] };
		uploadError = null;
		modalOpen   = true;
	}

	function confirmModal() {
		if (editingIdx === null) {
			items = [...items, { ...modalItem, attachments: [...modalItem.attachments] }];
		} else {
			items = items.map((item, i) =>
				i === editingIdx ? { ...modalItem, attachments: [...modalItem.attachments] } : item
			);
		}
		modalOpen = false;
	}

	function removeItem(idx: number) {
		items = items.filter((_, i) => i !== idx);
	}

	async function uploadAttachment(files: FileList | null) {
		if (!files?.[0]) return;
		uploading   = true;
		uploadError = null;
		try {
			const fd = new FormData();
			fd.append('file', files[0]);
			const result = await api.upload<{ id: string; fileName: string; mimeType: string }>(
				`/businesses/${businessId}/attachments`,
				fd
			);
			modalItem = { ...modalItem, attachments: [...modalItem.attachments, result] };
		} catch (e) {
			uploadError = e instanceof Error ? e.message : 'Upload failed';
		} finally {
			uploading = false;
			if (fileInputEl) fileInputEl.value = '';
		}
	}

	function removeAttachment(id: string) {
		modalItem = { ...modalItem, attachments: modalItem.attachments.filter((a) => a.id !== id) };
	}

	function onDragStart(e: DragEvent, idx: number) {
		dragIndex = idx;
		e.dataTransfer!.effectAllowed = 'move';
	}

	function onDragOver(e: DragEvent, idx: number) {
		e.preventDefault();
		if (dragIndex === null || dragIndex === idx) return;
		const arr = [...items];
		const [moved] = arr.splice(dragIndex, 1);
		arr.splice(idx, 0, moved);
		items     = arr;
		dragIndex = idx;
	}

	function onDragEnd() {
		dragIndex = null;
	}
</script>

{#if items.length > 0}
	<div class="rounded-lg border border-border overflow-hidden mb-3">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border bg-muted/50">
					<th class="w-7 px-2"></th>
					<th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Description</th>
					<th class="text-right px-2 py-2 text-xs font-medium text-muted-foreground w-28">Hrs × Rate</th>
					<th class="text-right px-3 py-2 text-xs font-medium text-muted-foreground w-20">Amount</th>
					<th class="w-16"></th>
				</tr>
			</thead>
			<tbody>
				{#each items as item, idx (idx)}
					<tr
						class="border-b border-border last:border-0 transition-opacity {dragIndex === idx ? 'opacity-40' : ''}"
						draggable="true"
						ondragstart={(e) => onDragStart(e, idx)}
						ondragover={(e) => onDragOver(e, idx)}
						ondragend={onDragEnd}
					>
						<td class="px-2 py-2 text-center">
							<GripVertical class="size-3.5 text-muted-foreground cursor-grab active:cursor-grabbing mx-auto" />
						</td>
						<td class="px-3 py-2">
							<p class="text-sm text-foreground truncate">{item.description || '—'}</p>
							{#if item.attachments?.length > 0}
								<span class="inline-flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
									<Paperclip class="size-3" />
									{item.attachments.length} file{item.attachments.length > 1 ? 's' : ''}
								</span>
							{/if}
						</td>
						<td class="px-2 py-2 text-right text-xs text-muted-foreground tabular-nums whitespace-nowrap">
							{item.hours} × {item.rate}
						</td>
						<td class="px-3 py-2 text-right text-sm tabular-nums">
							{rowAmount(item).toFixed(2)}
						</td>
						<td class="px-2 py-2">
							<div class="flex items-center gap-1 justify-end">
								<button
									type="button"
									onclick={() => openEdit(idx)}
									class="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
									title="Edit service"
								>
									<Pencil class="size-3" />
								</button>
								<button
									type="button"
									onclick={() => removeItem(idx)}
									class="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
									title="Remove service"
								>
									<X class="size-3" />
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr class="border-t border-border bg-muted/30">
					<td colspan="3" class="px-3 py-2 text-xs font-medium text-muted-foreground text-right">Total</td>
					<td class="px-3 py-2 text-sm font-semibold text-right tabular-nums">{grandTotal.toFixed(2)}</td>
					<td></td>
				</tr>
			</tfoot>
		</table>
	</div>
{/if}

<button
	type="button"
	onclick={openNew}
	class="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-xs font-medium transition-colors"
>
	<Plus class="size-3" />
	Add service
</button>

<!-- ── Service Modal ───────────────────────────────────────────────────────── -->
{#if modalOpen}
	<div
		class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
		role="presentation"
		onclick={(e) => { if (e.target === e.currentTarget) modalOpen = false; }}
	>
		<div class="bg-card border border-border rounded-lg shadow-lg w-full max-w-sm flex flex-col max-h-[90vh]">
			<!-- Header -->
			<div class="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
				<h3 class="font-semibold text-foreground">
					{editingIdx === null ? 'Add service' : 'Edit service'}
				</h3>
				<button
					type="button"
					onclick={() => (modalOpen = false)}
					class="p-1 rounded text-muted-foreground hover:bg-muted"
				>
					<X class="size-4" />
				</button>
			</div>

			<!-- Body -->
			<div class="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
				<!-- Description -->
				<div class="flex flex-col gap-1.5">
					<label class="text-sm font-medium text-foreground" for="si-desc">Description</label>
					<input
						id="si-desc"
						type="text"
						bind:value={modalItem.description}
						placeholder="e.g. Design consultation"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>

				<!-- Hours + Rate -->
				<div class="grid grid-cols-2 gap-3">
					<div class="flex flex-col gap-1.5">
						<label class="text-sm font-medium text-foreground" for="si-hours">Hours</label>
						<input
							id="si-hours"
							type="number"
							bind:value={modalItem.hours}
							min="0.25"
							step="0.25"
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>
					<div class="flex flex-col gap-1.5">
						<label class="text-sm font-medium text-foreground" for="si-rate">Rate/hr</label>
						<input
							id="si-rate"
							type="number"
							bind:value={modalItem.rate}
							min="0"
							step="0.01"
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>
				</div>

				<!-- Attachments -->
				<div class="flex flex-col gap-2">
					<p class="text-sm font-medium text-foreground">Attachments</p>

					{#if modalItem.attachments.length > 0}
						<div class="flex flex-col gap-2">
							{#each modalItem.attachments as att (att.id)}
								<div class="relative rounded-md border border-border bg-muted/30 overflow-hidden">
									{#if isImage(att.mimeType)}
										<img
											src={downloadUrl(att.id)}
											alt={att.fileName}
											class="w-full h-32 object-cover"
										/>
									{/if}
									<div class="flex items-center gap-2 px-3 py-2">
										{#if !isImage(att.mimeType)}
											<FileText class="size-3.5 text-muted-foreground shrink-0" />
										{/if}
										<span class="flex-1 text-xs text-foreground truncate">{att.fileName}</span>
										{#if canUploadAttachment}
											<button
												type="button"
												onclick={() => removeAttachment(att.id)}
												class="p-0.5 rounded text-muted-foreground hover:text-destructive shrink-0"
											>
												<X class="size-3" />
											</button>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}

					{#if canUploadAttachment}
						{#if uploadError}
							<p class="text-xs text-destructive">{uploadError}</p>
						{/if}

						<input
							bind:this={fileInputEl}
							type="file"
							accept="image/jpeg,image/png,application/pdf"
							class="hidden"
							onchange={(e) => uploadAttachment(e.currentTarget.files)}
						/>
						<button
							type="button"
							onclick={() => fileInputEl?.click()}
							disabled={uploading}
							class="flex items-center gap-1.5 px-3 py-2 rounded-md border border-dashed border-border bg-muted/20 hover:bg-muted/40 text-sm text-muted-foreground transition-colors disabled:opacity-50"
						>
							{#if uploading}
								<Loader2 class="size-3.5 animate-spin" />
								Uploading…
							{:else}
								<Paperclip class="size-3.5" />
								Attach file
							{/if}
						</button>
					{:else}
						<div class="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 text-sm">
							<Crown class="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
							<span class="text-amber-700 dark:text-amber-300">
								File attachments are available on the <a href="/organizations" class="underline font-medium">Pro plan</a>.
							</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Footer -->
			<div class="flex justify-end gap-2 px-5 py-4 border-t border-border shrink-0">
				<button
					type="button"
					onclick={() => (modalOpen = false)}
					class="px-3 py-1.5 rounded-md border border-input bg-background text-sm font-medium hover:bg-muted transition-colors"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={confirmModal}
					disabled={!modalItem.description.trim()}
					class="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
				>
					{editingIdx === null ? 'Add' : 'Save'}
				</button>
			</div>
		</div>
	</div>
{/if}
