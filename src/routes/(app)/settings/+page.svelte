<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { api } from '$lib/client/api.svelte';
	import { toast } from 'svelte-sonner';
	import { authState } from '$lib/stores/auth.svelte';
	import { userPrefersMode, setMode } from 'mode-watcher';
	import {
		ALL_NOTIFICATION_TYPES,
		NOTIFICATION_TYPE_LABELS,
		type NotificationType
	} from '$lib/configurations/notifications';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Switch } from '$lib/components/ui/switch';
	import { Loader2, Sun, Moon, Monitor } from '@lucide/svelte';

	const THEME_OPTIONS = [
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon },
		{ value: 'system', label: 'System', icon: Monitor }
	] as const;

	// Read initial tab from URL query param
	let activeTab = $state($page.url.searchParams.get('tab') ?? 'profile');

	// Notification preferences state
	let preferences = $state<Record<string, { pushEnabled: boolean; inAppEnabled: boolean }>>({});
	let loadingPrefs = $state(true);

	onMount(async () => {
		try {
			const res = await api.get<{
				data: { type: string; pushEnabled: boolean; inAppEnabled: boolean }[];
			}>('/notifications/preferences');
			for (const pref of res.data) {
				preferences[pref.type] = {
					pushEnabled: pref.pushEnabled,
					inAppEnabled: pref.inAppEnabled
				};
			}
		} catch {
			// Use defaults
		}
		for (const type of ALL_NOTIFICATION_TYPES) {
			if (!preferences[type]) {
				preferences[type] = { pushEnabled: true, inAppEnabled: true };
			}
		}
		loadingPrefs = false;
	});

	async function updatePref(
		type: NotificationType,
		field: 'pushEnabled' | 'inAppEnabled',
		value: boolean
	) {
		preferences[type][field] = value;
		try {
			await api.put('/notifications/preferences', { type, [field]: value });
			toast.success('Preferences saved');
		} catch (e) {
			preferences[type][field] = !value;
			toast.error(e instanceof Error ? e.message : 'Failed to save preferences');
		}
	}

	function onTabChange(value: string) {
		activeTab = value;
		const url = new URL($page.url);
		if (value === 'profile') {
			url.searchParams.delete('tab');
		} else {
			url.searchParams.set('tab', value);
		}
		goto(url.toString(), { replaceState: true, noScroll: true });
	}

	let user = $derived(authState.user);
</script>

<div class="max-w-2xl mx-auto p-4 md:p-6">
	<h1 class="text-xl font-bold mb-4">Settings</h1>

	<Tabs.Root value={activeTab} onValueChange={onTabChange}>
		<Tabs.List class="w-full">
			<Tabs.Trigger value="profile">Profile</Tabs.Trigger>
			<Tabs.Trigger value="appearance">Appearance</Tabs.Trigger>
			<Tabs.Trigger value="notifications">Notifications</Tabs.Trigger>
		</Tabs.List>

		<!-- Profile Tab -->
		<Tabs.Content value="profile">
			<div class="space-y-6 pt-2">
				{#if user}
					<div class="flex items-center gap-4">
						{#if user.photoURL}
							<img
								src={user.photoURL}
								alt="Avatar"
								class="size-16 rounded-full"
							/>
						{:else}
							<div
								class="size-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground"
							>
								{(user.displayName ?? user.email ?? '?')[0].toUpperCase()}
							</div>
						{/if}
						<div class="min-w-0">
							<p class="text-lg font-semibold truncate">
								{user.displayName ?? 'User'}
							</p>
							<p class="text-sm text-muted-foreground truncate">
								{user.email ?? ''}
							</p>
						</div>
					</div>
					<p class="text-xs text-muted-foreground">
						Your profile is managed by your Google account.
					</p>
				{:else}
					<p class="text-sm text-muted-foreground">Not signed in.</p>
				{/if}
			</div>
		</Tabs.Content>

		<!-- Appearance Tab -->
		<Tabs.Content value="appearance">
			<div class="space-y-4 pt-2">
				<div>
					<p class="text-sm font-medium mb-3">Theme</p>
					<div class="grid grid-cols-3 gap-3">
						{#each THEME_OPTIONS as opt}
							<button
								onclick={() => setMode(opt.value)}
								class="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors {userPrefersMode.current ===
								opt.value
									? 'border-primary bg-primary/5'
									: 'border-border hover:border-primary/50'}"
							>
								<opt.icon class="size-5" />
								<span class="text-sm">{opt.label}</span>
							</button>
						{/each}
					</div>
				</div>
			</div>
		</Tabs.Content>

		<!-- Notifications Tab -->
		<Tabs.Content value="notifications">
			{#if loadingPrefs}
				<div class="flex justify-center py-12">
					<Loader2 class="size-7 animate-spin text-muted-foreground" />
				</div>
			{:else}
				<div class="space-y-3 pt-2">
					{#each ALL_NOTIFICATION_TYPES as type}
						<div
							class="flex items-center justify-between p-4 border border-border rounded-lg bg-card"
						>
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
		</Tabs.Content>
	</Tabs.Root>
</div>
