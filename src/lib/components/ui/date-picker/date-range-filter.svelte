<script lang="ts">
	import { CalendarDate, DateFormatter, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { CalendarIcon, RotateCcw } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Select from '$lib/components/ui/select/index.js';

	type Preset = { label: string; from: string; to: string };
	type Unit = 'days' | 'weeks' | 'months' | 'years';

	let {
		from = $bindable(''),
		to = $bindable(''),
		onchange,
		class: className
	}: {
		from?: string;
		to?: string;
		onchange?: () => void;
		class?: string;
	} = $props();

	const df = new DateFormatter('en-US', { dateStyle: 'medium' });
	const tz = getLocalTimeZone();

	let open = $state(false);
	let activeLabel = $state('');
	let tab = $state<'quick' | 'relative' | 'absolute'>('quick');

	// Absolute picker state (local until Apply)
	let absFrom = $state('');
	let absTo = $state('');

	// Relative picker state
	let relAmount = $state(7);
	let relUnit = $state<Unit>('days');

	// Absolute picker: single calendar toggling between from/to
	let absPickingField = $state<'from' | 'to'>('from');

	const UNITS: Unit[] = ['days', 'weeks', 'months', 'years'];

	function fmt(d: CalendarDate): string {
		return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
	}

	function parseDate(s: string): CalendarDate | undefined {
		if (!s) return undefined;
		const [y, m, d] = s.split('-').map(Number);
		return new CalendarDate(y, m, d);
	}

	function daysAgo(n: number): { from: string; to: string } {
		const t = today(tz);
		const f = t.subtract({ days: n });
		return { from: fmt(f), to: fmt(t) };
	}

	function subtractFromToday(amount: number, unit: Unit): { from: string; to: string } {
		const t = today(tz);
		const f = t.subtract({ [unit]: amount });
		return { from: fmt(f), to: fmt(t) };
	}

	const presets: Preset[] = [
		{ label: 'Today', ...daysAgo(0) },
		{ label: 'Yesterday', ...(() => { const y = today(tz).subtract({ days: 1 }); return { from: fmt(y), to: fmt(y) }; })() },
		{ label: 'Last 7 days', ...daysAgo(7) },
		{ label: 'Last 30 days', ...daysAgo(30) },
		{ label: 'Last 90 days', ...daysAgo(90) },
		{ label: 'This month', ...(() => { const t = today(tz); return { from: fmt(new CalendarDate(t.year, t.month, 1)), to: fmt(t) }; })() },
		{ label: 'This year', ...(() => { const t = today(tz); return { from: fmt(new CalendarDate(t.year, 1, 1)), to: fmt(t) }; })() },
	];

	function applyPreset(p: Preset) {
		from = p.from;
		to = p.to;
		activeLabel = p.label;
		open = false;
		onchange?.();
	}

	function applyRelative() {
		if (relAmount <= 0) return;
		const range = subtractFromToday(relAmount, relUnit);
		from = range.from;
		to = range.to;
		activeLabel = `Last ${relAmount} ${relUnit}`;
		open = false;
		onchange?.();
	}

	function applyAbsolute() {
		from = absFrom;
		to = absTo;
		activeLabel = '';
		open = false;
		onchange?.();
	}

	function clear() {
		from = '';
		to = '';
		activeLabel = '';
		open = false;
		onchange?.();
	}

	// Calendar values as state for immediate visual feedback
	let absFromCal = $state<DateValue | undefined>(parseDate(from));
	let absToCal = $state<DateValue | undefined>(parseDate(to));

	// The active calendar value based on which field is being picked
	let absActiveCal = $derived(absPickingField === 'from' ? absFromCal : absToCal);

	function onAbsCalChange(v: DateValue | undefined) {
		if (absPickingField === 'from') {
			absFromCal = v;
			absPickingField = 'to';
		} else {
			absToCal = v;
		}
	}

	// Sync absolute pickers when popover opens
	$effect(() => {
		if (open && tab === 'absolute') {
			absFromCal = parseDate(from);
			absToCal = parseDate(to);
			absPickingField = 'from';
		}
	});

	// Keep string values in sync with calendar selections
	$effect(() => {
		absFrom = absFromCal ? fmt(absFromCal as CalendarDate) : '';
	});

	$effect(() => {
		absTo = absToCal ? fmt(absToCal as CalendarDate) : '';
	});

	let displayText = $derived.by(() => {
		if (activeLabel) return activeLabel;
		const s = parseDate(from);
		const e = parseDate(to);
		if (s && e) return `${df.format(s.toDate(tz))} — ${df.format(e.toDate(tz))}`;
		if (s) return `From ${df.format(s.toDate(tz))}`;
		if (e) return `Until ${df.format(e.toDate(tz))}`;
		return 'Date range';
	});

	const hasValue = $derived(!!from || !!to);

	const tabItems: { key: typeof tab; label: string }[] = [
		{ key: 'quick', label: 'Quick' },
		{ key: 'relative', label: 'Relative' },
		{ key: 'absolute', label: 'Absolute' },
	];
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				class={cn(
					'justify-start text-left font-normal gap-2',
					!hasValue && 'text-muted-foreground',
					className
				)}
			>
				<CalendarIcon class="size-4 shrink-0" />
				<span class="truncate">{displayText}</span>
				{#if hasValue}
					<button
						type="button"
						onclick={(e) => { e.stopPropagation(); clear(); }}
						class="ml-auto shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
					>
						<RotateCcw class="size-3" />
					</button>
				{/if}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-auto max-w-[calc(100vw-2rem)] p-0 max-h-[80vh] overflow-y-auto" align="start" avoidCollisions>
		<!-- Tabs -->
		<div class="flex border-b border-border">
			{#each tabItems as t}
				<button
					type="button"
					onclick={() => { tab = t.key; if (t.key === 'absolute') { absFromCal = parseDate(from); absToCal = parseDate(to); } }}
					class="flex-1 px-4 py-2 text-sm font-medium transition-colors {tab === t.key ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}"
				>
					{t.label}
				</button>
			{/each}
		</div>

		{#if tab === 'quick'}
			<div class="p-1 min-w-0 sm:min-w-[180px]">
				{#each presets as p}
					<button
						type="button"
						onclick={() => applyPreset(p)}
						class="w-full text-left px-3 py-2 rounded-md text-sm transition-colors
							{activeLabel === p.label && from === p.from && to === p.to ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'}"
					>
						{p.label}
					</button>
				{/each}
			</div>
		{:else if tab === 'relative'}
			<div class="p-4 min-w-0 sm:min-w-[260px]">
				<p class="text-sm text-muted-foreground mb-3">Show data from the last</p>
				<div class="flex gap-2 mb-4">
					<input
						type="number"
						min="1"
						bind:value={relAmount}
						class="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
					<Select.Root type="single" value={relUnit} onValueChange={(v) => { if (v) relUnit = v as Unit; }}>
						<Select.Trigger class="flex-1 capitalize">
							{relUnit}
						</Select.Trigger>
						<Select.Content>
							{#each UNITS as u}
								<Select.Item value={u} class="capitalize">{u}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex items-center justify-between">
					<p class="text-xs text-muted-foreground">
						{#if relAmount > 0}
							{@const range = subtractFromToday(relAmount, relUnit)}
							{df.format(parseDate(range.from)!.toDate(tz))} — {df.format(parseDate(range.to)!.toDate(tz))}
						{/if}
					</p>
					<Button
						size="sm"
						disabled={relAmount <= 0}
						onclick={applyRelative}
					>
						Apply
					</Button>
				</div>
			</div>
		{:else}
			<div class="p-3 sm:p-4 flex flex-col gap-3">
				<!-- From / To toggle -->
				<div class="grid grid-cols-2 gap-2">
					<button
						type="button"
						onclick={() => absPickingField = 'from'}
						class="rounded-md border px-3 py-1.5 text-sm text-left transition-colors
							{absPickingField === 'from' ? 'border-primary bg-primary/5 text-foreground font-medium' : 'border-input text-muted-foreground hover:bg-muted'}"
					>
						<span class="text-[10px] uppercase tracking-wide block mb-0.5">From</span>
						{absFrom ? df.format(parseDate(absFrom)!.toDate(tz)) : '—'}
					</button>
					<button
						type="button"
						onclick={() => absPickingField = 'to'}
						class="rounded-md border px-3 py-1.5 text-sm text-left transition-colors
							{absPickingField === 'to' ? 'border-primary bg-primary/5 text-foreground font-medium' : 'border-input text-muted-foreground hover:bg-muted'}"
					>
						<span class="text-[10px] uppercase tracking-wide block mb-0.5">To</span>
						{absTo ? df.format(parseDate(absTo)!.toDate(tz)) : '—'}
					</button>
				</div>
				<Calendar
					type="single"
					value={absActiveCal}
					onValueChange={onAbsCalChange}
					captionLayout="dropdown"
				/>
				<div class="flex items-center justify-between border-t border-border pt-3">
					<p class="text-xs text-muted-foreground">
						{#if absFrom && absTo}
							{df.format(parseDate(absFrom)!.toDate(tz))} — {df.format(parseDate(absTo)!.toDate(tz))}
						{:else if absFrom}
							From {df.format(parseDate(absFrom)!.toDate(tz))}
						{:else if absTo}
							Until {df.format(parseDate(absTo)!.toDate(tz))}
						{:else}
							Select dates
						{/if}
					</p>
					<Button
						size="sm"
						disabled={!absFrom && !absTo}
						onclick={applyAbsolute}
					>
						Apply
					</Button>
				</div>
			</div>
		{/if}
	</Popover.Content>
</Popover.Root>
