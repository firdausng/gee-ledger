<script lang="ts">
	import { X, Plus, GripVertical } from '@lucide/svelte';

	type LineItem = { description: string; quantity: number; unitPrice: string };

	let { items = $bindable<LineItem[]>([]) } = $props();

	let dragIndex = $state<number | null>(null);

	function rowAmount(item: LineItem): number {
		const price = parseFloat(item.unitPrice) || 0;
		return price * item.quantity;
	}

	const grandTotal = $derived(items.reduce((sum, i) => sum + rowAmount(i), 0));

	function addItem() {
		items = [...items, { description: '', quantity: 1, unitPrice: '0.00' }];
	}

	function removeItem(idx: number) {
		items = items.filter((_, i) => i !== idx);
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
		items = arr;
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
					<th class="text-right px-2 py-2 text-xs font-medium text-muted-foreground w-16">Qty</th>
					<th class="text-right px-2 py-2 text-xs font-medium text-muted-foreground w-24">Unit Price</th>
					<th class="text-right px-3 py-2 text-xs font-medium text-muted-foreground w-24">Amount</th>
					<th class="w-8"></th>
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
							<input
								type="text"
								bind:value={item.description}
								placeholder="e.g. Create domain"
								class="w-full bg-transparent focus:outline-none text-sm placeholder:text-muted-foreground/50"
							/>
						</td>
						<td class="px-2 py-2">
							<input
								type="number"
								bind:value={item.quantity}
								min="1"
								class="w-full bg-transparent focus:outline-none text-sm text-right"
							/>
						</td>
						<td class="px-2 py-2">
							<input
								type="number"
								bind:value={item.unitPrice}
								step="0.01"
								min="0"
								class="w-full bg-transparent focus:outline-none text-sm text-right"
							/>
						</td>
						<td class="px-3 py-2 text-right text-sm text-muted-foreground tabular-nums">
							{rowAmount(item).toFixed(2)}
						</td>
						<td class="px-2 py-2">
							<button
								type="button"
								onclick={() => removeItem(idx)}
								class="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
								title="Remove row"
							>
								<X class="size-3" />
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr class="border-t border-border bg-muted/30">
					<td colspan="4" class="px-3 py-2 text-xs font-medium text-muted-foreground text-right">Total</td>
					<td class="px-3 py-2 text-sm font-semibold text-right tabular-nums">{grandTotal.toFixed(2)}</td>
					<td></td>
				</tr>
			</tfoot>
		</table>
	</div>
{/if}

<button
	type="button"
	onclick={addItem}
	class="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-xs font-medium transition-colors"
>
	<Plus class="size-3" />
	Add item
</button>
