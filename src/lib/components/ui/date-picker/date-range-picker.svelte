<script lang="ts">
	import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';
	import { CalendarIcon } from '@lucide/svelte';
	import type { DateRange } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { RangeCalendar } from '$lib/components/ui/range-calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';

	let {
		from = $bindable(''),
		to = $bindable(''),
		placeholder = 'Pick a date range',
		onchange,
		class: className
	}: {
		from?: string;
		to?: string;
		placeholder?: string;
		onchange?: () => void;
		class?: string;
	} = $props();

	const df = new DateFormatter('en-US', { dateStyle: 'medium' });

	let open = $state(false);

	function parseDate(s: string): CalendarDate | undefined {
		if (!s) return undefined;
		const [y, m, d] = s.split('-').map(Number);
		return new CalendarDate(y, m, d);
	}

	function formatDate(date: CalendarDate): string {
		const y = String(date.year);
		const m = String(date.month).padStart(2, '0');
		const d = String(date.day).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	let rangeValue = $derived.by<DateRange | undefined>(() => {
		const start = parseDate(from);
		const end = parseDate(to);
		if (!start && !end) return undefined;
		return { start, end };
	});

	function onRangeChange(range: DateRange | undefined) {
		if (!range) return;
		if (range.start) from = formatDate(range.start as CalendarDate);
		if (range.end) to = formatDate(range.end as CalendarDate);
		if (range.start && range.end) {
			open = false;
			onchange?.();
		}
	}

	let displayText = $derived.by(() => {
		const start = parseDate(from);
		const end = parseDate(to);
		if (start && end) {
			const tz = getLocalTimeZone();
			return `${df.format(start.toDate(tz))} — ${df.format(end.toDate(tz))}`;
		}
		if (start) {
			return df.format(start.toDate(getLocalTimeZone()));
		}
		return placeholder;
	});
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				class={cn(
					'w-full justify-start text-left font-normal',
					!from && !to && 'text-muted-foreground',
					className
				)}
			>
				<CalendarIcon class="size-4" />
				{displayText}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-auto p-0" align="start">
		<RangeCalendar
			value={rangeValue}
			onValueChange={(v) => onRangeChange(v)}
			captionLayout="dropdown"
		/>
	</Popover.Content>
</Popover.Root>
