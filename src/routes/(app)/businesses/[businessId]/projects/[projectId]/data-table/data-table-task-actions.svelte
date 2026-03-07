<script lang="ts">
	import { Ellipsis } from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';

	let {
		status,
		billed,
		billingMode,
		onStatusChange,
		onEdit,
		onDelete,
		onTimeEntries,
	}: {
		status: string;
		billed: boolean;
		billingMode: string;
		onStatusChange: (status: string) => void;
		onEdit: () => void;
		onDelete: () => void;
		onTimeEntries?: () => void;
	} = $props();
</script>

{#if !billed}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant="ghost" class="h-7 w-7 p-0">
					<span class="sr-only">Open menu</span>
					<Ellipsis class="size-4" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			<DropdownMenu.Label>Status</DropdownMenu.Label>
			<DropdownMenu.Separator />
			{#each [['todo', 'To Do'], ['in-progress', 'In Progress'], ['done', 'Done']] as [value, label]}
				<DropdownMenu.Item
					onclick={() => { if (value !== status) onStatusChange(value); }}
					class={value === status ? 'font-medium bg-accent' : ''}
				>
					{label}
				</DropdownMenu.Item>
			{/each}
			<DropdownMenu.Separator />
			<DropdownMenu.Item onclick={onEdit}>Edit</DropdownMenu.Item>
			{#if billingMode === 'hourly' && onTimeEntries}
				<DropdownMenu.Item onclick={onTimeEntries}>Time Entries</DropdownMenu.Item>
			{/if}
			<DropdownMenu.Item class="text-destructive" onclick={onDelete}>Delete</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}
