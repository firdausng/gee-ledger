<script lang="ts">
	import { page } from '$app/stores';
	import { authActions } from '$lib/stores/auth.svelte';
	import {
		Building2,
		LayoutDashboard,
		Mail,
		LogOut,
		Menu,
		X,
		Plus,
		ChevronRight,
		ReceiptText,
		BookOpen,
		Tag,
		MapPin,
		ShoppingBag,
		Users
	} from '@lucide/svelte';

	let { children, data } = $props();

	let drawerOpen = $state(false);

	let currentBusinessId = $derived($page.params.businessId ?? null);
	let currentBusiness = $derived(
		currentBusinessId
			? (data.navBusinesses.find((b: { id: string }) => b.id === currentBusinessId) ?? null)
			: null
	);

	// Which business sub-menu is expanded — auto-syncs when navigating
	let expandedBusinessId = $state<string | null>(currentBusinessId);
	$effect(() => {
		expandedBusinessId = currentBusinessId;
	});

	function toggleBiz(id: string) {
		expandedBusinessId = expandedBusinessId === id ? null : id;
	}

	const bizTabs = [
		{ href: '', label: 'Transactions', icon: ReceiptText },
		{ href: '/accounts', label: 'Accounts', icon: BookOpen },
		{ href: '/categories', label: 'Categories', icon: Tag },
		{ href: '/locations', label: 'Locations', icon: MapPin },
		{ href: '/channels', label: 'Channels', icon: ShoppingBag },
		{ href: '/members', label: 'Members', icon: Users }
	];

	function isSubActive(bizId: string, tabHref: string): boolean {
		const base = `/businesses/${bizId}`;
		const path = $page.url.pathname;
		if (tabHref === '') return path === base || path.startsWith(`${base}/transactions`);
		return path.startsWith(`${base}${tabHref}`);
	}

	function closeDrawer() {
		drawerOpen = false;
	}
</script>

<div class="min-h-screen bg-background flex">
	<!-- ─── Sidebar (desktop) ─────────────────────────────────────── -->
	<aside
		class="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 border-r border-border bg-card z-20"
	>
		<!-- Logo -->
		<div class="h-14 flex items-center px-5 border-b border-border shrink-0">
			<a href="/businesses" class="flex items-center gap-2 font-semibold text-foreground">
				<LayoutDashboard class="size-5 text-primary" />
				<span>Gee Ledger</span>
			</a>
		</div>

		<nav class="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
			<!-- Businesses section -->
			<div class="px-2 pt-2 pb-1">
				<div class="flex items-center justify-between">
					<span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
						Businesses
					</span>
					<a
						href="/businesses"
						class="size-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
						title="Manage businesses"
					>
						<Plus class="size-3.5" />
					</a>
				</div>
			</div>

			{#each data.navBusinesses as biz (biz.id)}
				<button
					onclick={() => toggleBiz(biz.id)}
					class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors
						{currentBusinessId === biz.id
						? 'text-primary font-medium hover:bg-primary/5'
						: 'text-foreground hover:bg-muted'}"
				>
					<Building2 class="size-4 shrink-0" />
					<span class="truncate flex-1 text-left">{biz.name}</span>
					<ChevronRight
						class="size-3.5 shrink-0 transition-transform duration-200
							{expandedBusinessId === biz.id ? 'rotate-90' : ''}"
					/>
				</button>

				{#if expandedBusinessId === biz.id}
					<div class="ml-3 pl-3 border-l border-border flex flex-col gap-0.5 py-0.5">
						{#each bizTabs as tab}
							<a
								href="/businesses/{biz.id}{tab.href}"
								class="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors
									{isSubActive(biz.id, tab.href)
									? 'bg-primary/10 text-primary font-medium'
									: 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
							>
								<svelte:component this={tab.icon} class="size-3.5 shrink-0" />
								{tab.label}
							</a>
						{/each}
					</div>
				{/if}
			{:else}
				<p class="px-2 py-1.5 text-sm text-muted-foreground">No businesses yet.</p>
			{/each}
		</nav>

		<!-- Bottom nav -->
		<div class="p-3 border-t border-border flex flex-col gap-1">
			<a
				href="/invitations"
				class="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-foreground hover:bg-muted transition-colors"
			>
				<Mail class="size-4" />
				Invitations
			</a>
			<div class="pt-2 border-t border-border mt-1">
				<div class="px-2 py-1.5 flex items-center gap-2.5 mb-1">
					{#if data.user.photoURL}
						<img src={data.user.photoURL} alt="avatar" class="size-7 rounded-full" />
					{:else}
						<div
							class="size-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold"
						>
							{(data.user.displayName ?? data.user.email ?? '?')[0].toUpperCase()}
						</div>
					{/if}
					<div class="min-w-0">
						<p class="text-sm font-medium truncate">{data.user.displayName ?? 'User'}</p>
						<p class="text-xs text-muted-foreground truncate">{data.user.email ?? ''}</p>
					</div>
				</div>
				<button
					onclick={() => authActions.signOut()}
					class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
				>
					<LogOut class="size-4" />
					Sign out
				</button>
			</div>
		</div>
	</aside>

	<!-- ─── Main area ─────────────────────────────────────────────── -->
	<div class="flex-1 lg:pl-64 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
		<!-- Mobile topbar -->
		<header
			class="lg:hidden sticky top-0 z-10 h-14 border-b border-border bg-background/95 backdrop-blur flex items-center px-4 gap-3"
		>
			<button
				onclick={() => (drawerOpen = !drawerOpen)}
				class="p-1.5 rounded-md hover:bg-muted text-muted-foreground shrink-0"
				aria-label="Toggle menu"
			>
				<Menu class="size-5" />
			</button>
			{#if currentBusiness}
				<span class="font-semibold text-foreground truncate">{currentBusiness.name}</span>
			{:else}
				<a href="/businesses" class="flex items-center gap-2 font-semibold text-foreground">
					<LayoutDashboard class="size-5 text-primary" />
					<span>Gee Ledger</span>
				</a>
			{/if}
		</header>

		<!-- Page content -->
		<main class="flex-1">
			{@render children()}
		</main>
	</div>
</div>

<!-- ─── Mobile drawer overlay ───────────────────────────────────── -->
{#if drawerOpen}
	<!-- Backdrop -->
	<div
		class="lg:hidden fixed inset-0 z-30 bg-black/40"
		role="presentation"
		onclick={closeDrawer}
	></div>

	<!-- Drawer panel -->
	<div class="lg:hidden fixed inset-y-0 left-0 z-40 w-72 bg-card border-r border-border flex flex-col">
		<div class="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
			<a href="/businesses" class="flex items-center gap-2 font-semibold text-foreground" onclick={closeDrawer}>
				<LayoutDashboard class="size-5 text-primary" />
				<span>Gee Ledger</span>
			</a>
			<button onclick={closeDrawer} class="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
				<X class="size-5" />
			</button>
		</div>

		<nav class="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
			<div class="px-2 pt-2 pb-1">
				<span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
					Businesses
				</span>
			</div>

			{#each data.navBusinesses as biz (biz.id)}
				<button
					onclick={() => toggleBiz(biz.id)}
					class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors
						{currentBusinessId === biz.id
						? 'text-primary font-medium hover:bg-primary/5'
						: 'text-foreground hover:bg-muted'}"
				>
					<Building2 class="size-4 shrink-0" />
					<span class="truncate flex-1 text-left">{biz.name}</span>
					<ChevronRight
						class="size-3.5 shrink-0 transition-transform duration-200
							{expandedBusinessId === biz.id ? 'rotate-90' : ''}"
					/>
				</button>

				{#if expandedBusinessId === biz.id}
					<div class="ml-3 pl-3 border-l border-border flex flex-col gap-0.5 py-0.5">
						{#each bizTabs as tab}
							<a
								href="/businesses/{biz.id}{tab.href}"
								class="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors
									{isSubActive(biz.id, tab.href)
									? 'bg-primary/10 text-primary font-medium'
									: 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
								onclick={closeDrawer}
							>
								<svelte:component this={tab.icon} class="size-3.5 shrink-0" />
								{tab.label}
							</a>
						{/each}
					</div>
				{/if}
			{/each}
		</nav>

		<div class="p-3 border-t border-border flex flex-col gap-1">
			<a
				href="/invitations"
				onclick={closeDrawer}
				class="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-foreground hover:bg-muted"
			>
				<Mail class="size-4" />
				Invitations
			</a>
			<button
				onclick={() => authActions.signOut()}
				class="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-destructive hover:bg-destructive/10"
			>
				<LogOut class="size-4" />
				Sign out
			</button>
		</div>
	</div>
{/if}
