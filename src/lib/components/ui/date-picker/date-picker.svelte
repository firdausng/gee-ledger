<script lang="ts">
	import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';
	import { CalendarIcon } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';

	let {
		value = $bindable(''),
		placeholder = 'Pick a date',
		id,
		class: className
	}: {
		value?: string;
		placeholder?: string;
		id?: string;
		class?: string;
	} = $props();

	const df = new DateFormatter('en-US', { dateStyle: 'medium' });

	let open = $state(false);

	let calendarValue = $derived.by(() => {
		if (!value) return undefined;
		const [y, m, d] = value.split('-').map(Number);
		return new CalendarDate(y, m, d);
	});

	function onSelect(date: CalendarDate | undefined) {
		if (!date) return;
		const y = String(date.year);
		const m = String(date.month).padStart(2, '0');
		const d = String(date.day).padStart(2, '0');
		value = `${y}-${m}-${d}`;
		open = false;
	}

	let displayText = $derived(
		calendarValue ? df.format(calendarValue.toDate(getLocalTimeZone())) : placeholder
	);
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				{id}
				variant="outline"
				class={cn(
					'w-full justify-start text-left font-normal',
					!value && 'text-muted-foreground',
					className
				)}
			>
				<CalendarIcon class="size-4" />
				{displayText}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-auto p-0" align="start">
		<Calendar
			type="single"
			value={calendarValue}
			onValueChange={(v) => onSelect(v)}
			captionLayout="dropdown"
		/>
	</Popover.Content>
</Popover.Root>
