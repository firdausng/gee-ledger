<script lang="ts">
	import { Check, ChevronsUpDown } from '@lucide/svelte';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { PHONE_CODES } from '$lib/data/phoneCodes';

	let {
		value = $bindable('+1'),
	}: {
		value: string;
	} = $props();

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);

	const selected = $derived(
		PHONE_CODES.find((p) => p.code === value)
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
				variant="ghost"
				size="sm"
				class="shrink-0 h-auto rounded-none border-r border-input px-2 py-2 text-sm font-normal hover:bg-muted"
				role="combobox"
				aria-expanded={open}
			>
				{#if selected}
					{selected.flag} {selected.code}
				{:else}
					{value}
				{/if}
				<ChevronsUpDown class="size-3 opacity-50 ml-0.5" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-[240px] p-0" align="start">
		<Command.Root>
			<Command.Input placeholder="Search country..." />
			<Command.List>
				<Command.Empty>No country found.</Command.Empty>
				<Command.Group>
					{#each PHONE_CODES as p (p.code)}
						<Command.Item
							value="{p.country} {p.code}"
							onSelect={() => {
								value = p.code;
								closeAndFocusTrigger();
							}}
						>
							<Check class={cn('size-3.5', value !== p.code && 'text-transparent')} />
							<span>{p.flag}</span>
							<span class="font-medium">{p.code}</span>
							<span class="text-muted-foreground">{p.country}</span>
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
