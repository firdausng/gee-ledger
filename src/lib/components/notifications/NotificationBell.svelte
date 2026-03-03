<script lang="ts">
	import { Bell } from '@lucide/svelte';
	import { notificationState, notificationActions } from '$lib/stores/notifications.svelte';
	import * as Popover from '$lib/components/ui/popover';
	import NotificationList from './NotificationList.svelte';

	let unreadCount = $derived(notificationState.unreadCount);

	function handleOpenChange(open: boolean) {
		notificationState.open = open;
		if (open) {
			notificationActions.fetchNotifications();
		}
	}
</script>

<Popover.Root open={notificationState.open} onOpenChange={handleOpenChange}>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button
				{...props}
				class="relative p-2 rounded-md hover:bg-accent transition-colors"
				aria-label="Notifications"
			>
				<Bell class="size-5" />
				{#if unreadCount > 0}
					<span
						class="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-destructive rounded-full"
					>
						{unreadCount > 99 ? '99+' : unreadCount}
					</span>
				{/if}
			</button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-80 p-0" align="end" sideOffset={8}>
		<NotificationList />
	</Popover.Content>
</Popover.Root>
