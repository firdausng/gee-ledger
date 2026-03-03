<script lang="ts">
	import { notificationState, notificationActions } from '$lib/stores/notifications.svelte';
	import { goto } from '$app/navigation';
	import { CheckCheck, Loader2 } from '@lucide/svelte';

	let notifications = $derived(notificationState.notifications);
	let loading = $derived(notificationState.loading);

	function handleClick(notification: (typeof notifications)[0]) {
		notificationActions.markAsRead(notification.id);
		notificationState.open = false;
		if (notification.actionUrl) {
			goto(notification.actionUrl);
		}
	}

	function timeAgo(dateStr: string): string {
		const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
		if (seconds < 60) return 'just now';
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
		return `${Math.floor(seconds / 86400)}d ago`;
	}
</script>

<div class="flex flex-col max-h-96">
	<!-- Header -->
	<div class="flex items-center justify-between px-4 py-3 border-b">
		<h3 class="text-sm font-semibold">Notifications</h3>
		{#if notificationState.unreadCount > 0}
			<button
				class="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
				onclick={() => notificationActions.markAllAsRead()}
			>
				<CheckCheck class="size-3" />
				Mark all read
			</button>
		{/if}
	</div>

	<!-- List -->
	<div class="overflow-y-auto flex-1">
		{#if loading && notifications.length === 0}
			<div class="flex justify-center py-8">
				<Loader2 class="size-5 animate-spin text-muted-foreground" />
			</div>
		{:else if notifications.length === 0}
			<p class="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet</p>
		{:else}
			{#each notifications as notification (notification.id)}
				<button
					class="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0 flex gap-3 {notification.isRead
						? 'opacity-60'
						: ''}"
					onclick={() => handleClick(notification)}
				>
					{#if !notification.isRead}
						<div class="mt-1.5 size-2 rounded-full bg-primary shrink-0"></div>
					{:else}
						<div class="mt-1.5 size-2 shrink-0"></div>
					{/if}
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium truncate">{notification.title}</p>
						<p class="text-xs text-muted-foreground line-clamp-2">{notification.body}</p>
						<p class="text-[10px] text-muted-foreground/60 mt-1">
							{timeAgo(notification.createdAt)}
						</p>
					</div>
				</button>
			{/each}
		{/if}
	</div>

	<!-- Footer -->
	<div class="border-t px-4 py-2">
		<a
			href="/notifications/preferences"
			class="text-xs text-muted-foreground hover:text-foreground"
			onclick={() => (notificationState.open = false)}
		>
			Notification settings
		</a>
	</div>
</div>
