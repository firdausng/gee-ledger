<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/client/api.svelte';
	import { X } from '@lucide/svelte';

	let {
		businessId,
		params,
		active = $bindable({}),
		onchange
	}: {
		businessId: string;
		params: string[];
		active: Record<string, string>;
		onchange: () => void;
	} = $props();

	type FilterChip = { key: string; label: string; id: string; name: string };

	let chips = $state<FilterChip[]>([]);

	const meta: Record<string, { label: string }> = {
		contactId: { label: 'Contact' },
		projectId: { label: 'Project' },
		categoryId: { label: 'Category' },
		locationId: { label: 'Location' },
		salesChannelId: { label: 'Channel' },
	};

	const listCache: Record<string, { id: string; name: string }[]> = {};

	async function fetchList(endpoint: string): Promise<{ id: string; name: string }[]> {
		if (listCache[endpoint]) return listCache[endpoint];
		const data = await api.get<{ id: string; name: string }[]>(`/businesses/${businessId}/${endpoint}`);
		listCache[endpoint] = data;
		return data;
	}

	async function resolveName(key: string, id: string): Promise<string> {
		try {
			let name: string;
			switch (key) {
				case 'contactId':
					name = (await api.get<{ name: string }>(`/businesses/${businessId}/contacts/${id}`)).name;
					break;
				case 'projectId':
					name = (await api.get<{ name: string }>(`/businesses/${businessId}/projects/${id}`)).name;
					break;
				case 'categoryId': {
					const list = await fetchList('categories');
					name = list.find((c) => c.id === id)?.name ?? id;
					break;
				}
				case 'locationId': {
					const list = await fetchList('locations');
					name = list.find((l) => l.id === id)?.name ?? id;
					break;
				}
				case 'salesChannelId': {
					const list = await fetchList('channels');
					name = list.find((c) => c.id === id)?.name ?? id;
					break;
				}
				default:
					name = id;
			}
			return name;
		} catch {
			return id;
		}
	}

	function dismiss(key: string) {
		chips = chips.filter((f) => f.key !== key);
		const { [key]: _, ...rest } = active;
		active = rest;
		// Clean URL
		const url = new URL(window.location.href);
		url.searchParams.delete(key);
		window.history.replaceState({}, '', url.toString());
		onchange();
	}

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);

		const initialActive: Record<string, string> = {};
		for (const key of params) {
			const id = urlParams.get(key);
			if (id) initialActive[key] = id;
		}

		if (Object.keys(initialActive).length === 0) {
			active = {};
			chips = [];
			return;
		}

		// Build chips with placeholder names
		const initial: FilterChip[] = [];
		for (const [key, id] of Object.entries(initialActive)) {
			const m = meta[key];
			if (!m) continue;
			initial.push({ key, label: m.label, id, name: '' });
		}

		chips = initial;
		active = initialActive;

		// Resolve names and replace chips with resolved versions
		const resolved = await Promise.all(
			initial.map(async (chip) => ({
				...chip,
				name: await resolveName(chip.key, chip.id)
			}))
		);
		chips = resolved;
	});
</script>

{#if chips.length > 0}
	<div class="flex flex-wrap items-center gap-2 mb-3">
		{#each chips as f (f.key)}
			<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-sm text-foreground">
				{f.label}: <span class="font-medium">{f.name || 'Loading…'}</span>
				<button
					onclick={() => dismiss(f.key)}
					class="p-0.5 rounded-full hover:bg-background/80 text-muted-foreground hover:text-foreground"
				>
					<X class="size-3" />
				</button>
			</span>
		{/each}
	</div>
{/if}
