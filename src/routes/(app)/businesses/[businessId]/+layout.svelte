<script lang="ts">
	import { page } from '$app/stores';
	import {
		ArrowLeft,
		ReceiptText,
		BookOpen,
		Tag,
		MapPin,
		ShoppingBag,
		Users
	} from '@lucide/svelte';

	let { children, data } = $props();

	const tabs = [
		{ href: '', label: 'Transactions', icon: ReceiptText },
		{ href: '/accounts', label: 'Accounts', icon: BookOpen },
		{ href: '/categories', label: 'Categories', icon: Tag },
		{ href: '/locations', label: 'Locations', icon: MapPin },
		{ href: '/channels', label: 'Channels', icon: ShoppingBag },
		{ href: '/members', label: 'Members', icon: Users }
	];

	let baseHref = $derived(`/businesses/${data.business.id}`);

	function isActive(tabHref: string): boolean {
		const fullHref = baseHref + tabHref;
		const path = $page.url.pathname;
		if (tabHref === '') return path === baseHref;
		return path.startsWith(fullHref);
	}
</script>

<div class="flex flex-col min-h-full">
	<!-- Business header -->
	<div class="border-b border-border bg-card">
		<div class="px-4 md:px-6 pt-4 pb-0">
			<a
				href="/businesses"
				class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
			>
				<ArrowLeft class="size-3.5" />
				Businesses
			</a>
			<div class="flex items-center justify-between mb-3">
				<div>
					<h1 class="text-xl font-bold text-foreground">{data.business.name}</h1>
					<div class="flex items-center gap-2 mt-0.5">
						<span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
							{data.business.currency}
						</span>
						<span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
							{data.policyKey}
						</span>
					</div>
				</div>
			</div>

			<!-- Tab navigation -->
			<nav class="flex gap-0 overflow-x-auto -mb-px">
				{#each tabs as tab (tab.href)}
					<a
						href={baseHref + tab.href}
						class="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
							{isActive(tab.href)
							? 'border-primary text-primary'
							: 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'}"
					>
						<svelte:component this={tab.icon} class="size-4" />
						{tab.label}
					</a>
				{/each}
			</nav>
		</div>
	</div>

	<!-- Page content -->
	<div class="flex-1 p-4 md:p-6">
		{@render children()}
	</div>
</div>
