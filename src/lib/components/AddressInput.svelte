<script lang="ts">
	import { Check, ChevronsUpDown } from '@lucide/svelte';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { COUNTRIES } from '$lib/data/countries';

	let {
		line1 = $bindable(''),
		line2 = $bindable(''),
		city = $bindable(''),
		region = $bindable(''),
		postalCode = $bindable(''),
		country = $bindable(''),
	}: {
		line1: string;
		line2: string;
		city: string;
		region: string;
		postalCode: string;
		country: string;
	} = $props();

	let countryOpen = $state(false);
	let countryTriggerRef = $state<HTMLButtonElement>(null!);

	const selectedCountry = $derived(
		COUNTRIES.find((c) => c.name === country)
	);

	function closeAndFocusTrigger() {
		countryOpen = false;
		tick().then(() => countryTriggerRef?.focus());
	}

	const inputClass = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';
</script>

<div class="flex flex-col gap-2">
	<input type="text" bind:value={line1} placeholder="Street address"
		class={inputClass} />
	<input type="text" bind:value={line2} placeholder="Apt, suite, unit (optional)"
		class={inputClass} />
	<div class="grid grid-cols-2 gap-2">
		<input type="text" bind:value={city} placeholder="City"
			class={inputClass} />
		<input type="text" bind:value={region} placeholder="State / Region"
			class={inputClass} />
	</div>
	<div class="grid grid-cols-2 gap-2">
		<input type="text" bind:value={postalCode} placeholder="Postal code"
			class={inputClass} />
		<Popover.Root bind:open={countryOpen}>
			<Popover.Trigger bind:ref={countryTriggerRef}>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						class="w-full justify-between font-normal"
						role="combobox"
						aria-expanded={countryOpen}
					>
						{#if selectedCountry}
							{selectedCountry.name}
						{:else if country}
							{country}
						{:else}
							<span class="text-muted-foreground">Country</span>
						{/if}
						<ChevronsUpDown class="size-3.5 opacity-50" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-[240px] p-0" align="start">
				<Command.Root>
					<Command.Input placeholder="Search country..." />
					<Command.List>
						<Command.Empty>No country found.</Command.Empty>
						<Command.Group>
							{#each COUNTRIES as c (c.code)}
								<Command.Item
									value="{c.name} {c.code}"
									onSelect={() => {
										country = c.name;
										closeAndFocusTrigger();
									}}
								>
									<Check class={cn('size-3.5', country !== c.name && 'text-transparent')} />
									<span>{c.name}</span>
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>
</div>
