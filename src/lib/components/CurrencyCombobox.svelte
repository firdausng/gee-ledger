<script lang="ts">
	import { Check, ChevronsUpDown } from '@lucide/svelte';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { currencyList } from '$lib/configurations/currencies';

	let {
		value = $bindable(''),
		placeholder = 'Select currency...',
		class: className = '',
	}: {
		value: string;
		placeholder?: string;
		class?: string;
	} = $props();

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);

	const selectedCurrency = $derived(
		currencyList.find((c) => c.code === value)
	);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => triggerRef?.focus());
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				class={cn('w-full justify-between font-normal', className)}
				role="combobox"
				aria-expanded={open}
			>
				{#if selectedCurrency}
					{selectedCurrency.code} — {selectedCurrency.name}
				{:else}
					<span class="text-muted-foreground">{placeholder}</span>
				{/if}
				<ChevronsUpDown class="size-3.5 opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-[280px] p-0">
		<Command.Root>
			<Command.Input placeholder="Search currency..." />
			<Command.List>
				<Command.Empty>No currency found.</Command.Empty>
				<Command.Group>
					{#each currencyList as cur (cur.code)}
						<Command.Item
							value="{cur.code} {cur.name}"
							onSelect={() => {
								value = cur.code;
								closeAndFocusTrigger();
							}}
						>
							<Check class={cn('size-3.5', value !== cur.code && 'text-transparent')} />
							<span class="font-medium">{cur.code}</span>
							<span class="text-muted-foreground">{cur.name}</span>
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
