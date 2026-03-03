<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/client/api.svelte';
	import {
		ALL_NOTIFICATION_TYPES,
		NOTIFICATION_TYPE_LABELS,
		type NotificationType
	} from '$lib/configurations/notifications';
	import { Switch } from '$lib/components/ui/switch';
	import { Loader2 } from '@lucide/svelte';

	let preferences = $state<Record<string, { pushEnabled: boolean; inAppEnabled: boolean }>>({});
	let loading = $state(true);

	onMount(async () => {
		try {
			const res = await api.get<{ data: { type: string; pushEnabled: boolean; inAppEnabled: boolean }[] }>(
				'/notifications/preferences'
			);
			for (const pref of res.data) {
				preferences[pref.type] = {
					pushEnabled: pref.pushEnabled,
					inAppEnabled: pref.inAppEnabled
				};
			}
		} catch {
			// Use defaults
		}
		// Fill defaults for types not in DB
		for (const type of ALL_NOTIFICATION_TYPES) {
			if (!preferences[type]) {
				preferences[type] = { pushEnabled: true, inAppEnabled: true };
			}
		}
		loading = false;
	});

	async function updatePref(
		type: NotificationType,
		field: 'pushEnabled' | 'inAppEnabled',
		value: boolean
	) {
		preferences[type][field] = value;
		try {
			await api.put('/notifications/preferences', { type, [field]: value });
		} catch {
			// Revert on error
			preferences[type][field] = !value;
		}
	}
</script>

<div class="max-w-2xl mx-auto p-6">
	<h1 class="text-xl font-bold mb-6">Notification Preferences</h1>
	{#if loading}
		<div class="flex justify-center py-12">
			<Loader2 class="size-7 animate-spin text-muted-foreground" />
		</div>
	{:else}
		<div class="space-y-3">
			{#each ALL_NOTIFICATION_TYPES as type}
				<div class="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
					<p class="text-sm font-medium">{NOTIFICATION_TYPE_LABELS[type]}</p>
					<div class="flex items-center gap-4">
						<div class="flex items-center gap-2">
							<span class="text-xs text-muted-foreground">In-app</span>
							<Switch
								checked={preferences[type]?.inAppEnabled ?? true}
								onCheckedChange={(v) => updatePref(type, 'inAppEnabled', v)}
							/>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-xs text-muted-foreground">Push</span>
							<Switch
								checked={preferences[type]?.pushEnabled ?? true}
								onCheckedChange={(v) => updatePref(type, 'pushEnabled', v)}
							/>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
