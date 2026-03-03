<script lang="ts">
	import { page } from '$app/stores';
	import { authActions } from '$lib/stores/auth.svelte';
	import logoSvg from '$lib/assets/logo.svg?raw';
	import {
		Building2,
		LayoutDashboard,
		Mail,
		LogOut,
		Plus,
		ChevronRight,
		ReceiptText,
		BookOpen,
		Tag,
		MapPin,
		ShoppingBag,
		Users,
		Paperclip,
		Settings2,
		ScrollText,
		UsersRound,
		Crown,
		Package,
		Sparkles,
		Sun,
		Moon,
		X
	} from '@lucide/svelte';
	import { toggleMode, mode } from 'mode-watcher';
	import { Collapsible } from 'bits-ui';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { onMount } from 'svelte';
	import NotificationBell from '$lib/components/notifications/NotificationBell.svelte';
	import { registerDeviceToken, onForegroundMessage } from '$lib/messaging/fcm.client';
	import { notificationActions } from '$lib/stores/notifications.svelte';
	import { authState } from '$lib/stores/auth.svelte';

	let { children, data } = $props();

	let bannerDismissed = $state(false);

	let currentBusinessId = $derived($page.params.businessId ?? null);
	let currentBusiness = $derived(
		currentBusinessId
			? (data.navBusinesses.find((b: { id: string }) => b.id === currentBusinessId) ?? null)
			: null
	);

	const bizTabs = [
		{ href: '', label: 'Overview', icon: LayoutDashboard },
		{ href: '/transactions', label: 'Transactions', icon: ReceiptText },
		{ href: '/contacts', label: 'Contacts', icon: UsersRound },
		{ href: '/accounts', label: 'Accounts', icon: BookOpen },
		{ href: '/products', label: 'Products', icon: Package },
		{ href: '/categories', label: 'Categories', icon: Tag },
		{ href: '/locations', label: 'Locations', icon: MapPin },
		{ href: '/channels', label: 'Channels', icon: ShoppingBag },
		{ href: '/members', label: 'Members', icon: Users },
		{ href: '/attachments', label: 'Attachments', icon: Paperclip },
		{ href: '/statement', label: 'Statement', icon: ScrollText },
		{ href: '/settings', label: 'Settings', icon: Settings2 }
	];

	function isSubActive(bizId: string, tabHref: string): boolean {
		const base = `/businesses/${bizId}`;
		const path = $page.url.pathname;
		if (tabHref === '') return path === base;
		return path.startsWith(`${base}${tabHref}`);
	}

	onMount(() => {
		// Register device for push notifications
		const user = authState.user;
		if (user) {
			user.getIdToken().then((idToken: string) => {
				registerDeviceToken(idToken).catch(() => {});
			});
		}

		// Listen for foreground push messages
		const unsubscribe = onForegroundMessage((payload) => {
			notificationActions.addFromPush(payload);
		});

		// Fetch existing notifications
		notificationActions.fetchNotifications();

		return () => {
			if (unsubscribe) unsubscribe();
		};
	});
</script>

<Sidebar.Provider>
	<Sidebar.Root collapsible="offcanvas" side="left">
		<!-- Header: Logo -->
		<Sidebar.Header>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton size="lg">
						{#snippet child({ props })}
							<a href="/businesses" {...props}>
								<div class="[&_svg]:h-5 [&_svg]:w-auto">
									{@html logoSvg}
								</div>
								<span class="font-semibold text-sm">Gee Ledger</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Header>

		<!-- Content: Nav -->
		<Sidebar.Content>
			<!-- Businesses group -->
			<Sidebar.Group>
				<Sidebar.GroupLabel>
					Businesses
					<Sidebar.GroupAction>
						{#snippet child({ props })}
							<a href="/businesses" {...props} title="Manage businesses">
								<Plus class="size-4" />
							</a>
						{/snippet}
					</Sidebar.GroupAction>
				</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each data.navBusinesses as biz (biz.id)}
							<Collapsible.Root open={currentBusinessId === biz.id}>
								<Sidebar.MenuItem>
									<Sidebar.MenuButton isActive={currentBusinessId === biz.id}>
										{#snippet child({ props })}
											<a href="/businesses/{biz.id}" {...props}>
												<Building2 class="size-4" />
												<span class="truncate flex-1">{biz.name}</span>
												<Collapsible.Trigger
													class="ml-auto"
													onclick={(e: MouseEvent) => e.preventDefault()}
												>
													<ChevronRight
														class="size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
													/>
												</Collapsible.Trigger>
											</a>
										{/snippet}
									</Sidebar.MenuButton>
									<Collapsible.Content>
										<Sidebar.MenuSub>
											{#each bizTabs as tab}
												<Sidebar.MenuSubItem>
													<Sidebar.MenuSubButton
														href="/businesses/{biz.id}{tab.href}"
														isActive={isSubActive(biz.id, tab.href)}
													>
														<tab.icon class="size-3.5" />
														<span>{tab.label}</span>
													</Sidebar.MenuSubButton>
												</Sidebar.MenuSubItem>
											{/each}
										</Sidebar.MenuSub>
									</Collapsible.Content>
								</Sidebar.MenuItem>
							</Collapsible.Root>
						{:else}
							<Sidebar.MenuItem>
								<p class="px-2 py-1.5 text-sm text-muted-foreground">No businesses yet.</p>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>

			<!-- General links -->
			<Sidebar.Group class="mt-auto">
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a href="/organizations" {...props}>
										<Crown class="size-4" />
										<span>Organizations</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a href="/invitations" {...props}>
										<Mail class="size-4" />
										<span>Invitations</span>
										{#if data.pendingInvitationCount > 0}
											<span class="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-destructive rounded-full">
												{data.pendingInvitationCount}
											</span>
										{/if}
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton onclick={toggleMode}>
								{#if mode.current === 'dark'}
									<Sun class="size-4" />
									<span>Light mode</span>
								{:else}
									<Moon class="size-4" />
									<span>Dark mode</span>
								{/if}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		</Sidebar.Content>

		<!-- Footer: User info -->
		<Sidebar.Footer>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<div class="flex items-center gap-2.5 px-2 py-1.5">
						{#if data.user.photoURL}
							<img src={data.user.photoURL} alt="avatar" class="size-7 rounded-full shrink-0" />
						{:else}
							<div
								class="size-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary text-xs font-bold shrink-0"
							>
								{(data.user.displayName ?? data.user.email ?? '?')[0].toUpperCase()}
							</div>
						{/if}
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium truncate">{data.user.displayName ?? 'User'}</p>
							<p class="text-xs text-sidebar-foreground/60 truncate">{data.user.email ?? ''}</p>
						</div>
					</div>
				</Sidebar.MenuItem>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton
						onclick={() => authActions.signOut()}
						class="text-destructive hover:text-destructive"
					>
						<LogOut class="size-4" />
						<span>Sign out</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Footer>
	</Sidebar.Root>

	<!-- Main content area -->
	<Sidebar.Inset>
		<!-- Top bar -->
		<header
			class="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-4"
		>
			<Sidebar.Trigger class="md:hidden" />
			{#if currentBusiness}
				<span class="font-semibold text-foreground truncate">{currentBusiness.name}</span>
			{:else}
				<a
					href="/businesses"
					class="flex items-center gap-2 text-foreground [&_svg]:h-5 [&_svg]:w-auto"
				>
					{@html logoSvg}
					<span class="font-semibold">Gee Ledger</span>
				</a>
			{/if}
			<div class="ml-auto flex items-center gap-2">
				<NotificationBell />
			</div>
		</header>

		<!-- Upgrade banner -->
		{#if data.upgradeOrgId && !bannerDismissed}
			<div
				class="border-b border-amber-200 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-900/10"
			>
				<div class="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
					<a
						href="/organizations/{data.upgradeOrgId}"
						class="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 hover:underline"
					>
						<Sparkles class="size-3.5 shrink-0" />
						<span>Upgrade to Pro for exports, attachments, email & more</span>
					</a>
					<button
						onclick={() => (bannerDismissed = true)}
						class="text-amber-500 dark:text-amber-600 hover:text-amber-700 dark:hover:text-amber-400 shrink-0"
						aria-label="Dismiss"
					>
						<X class="size-3.5" />
					</button>
				</div>
			</div>
		{/if}

		<!-- Page content -->
		<main class="flex-1">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
