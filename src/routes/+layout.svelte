<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authState, authActions } from '$lib/stores/auth.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-gray-50">
	<nav class="bg-white shadow">
		<div class="container mx-auto px-4 py-3 flex justify-between items-center">
			<a href="/" class="text-xl font-bold text-gray-800 hover:text-gray-600">Gee Ledger</a>

			<div>
				{#if authState.loading}
					<span class="text-gray-500">Loading...</span>
				{:else if authState.user}
					<div class="flex items-center gap-4">
						{#if authState.user.photoURL}
							<img
								src={authState.user.photoURL}
								alt="Profile"
								class="w-8 h-8 rounded-full"
							/>
						{/if}
						<span class="text-gray-700">
							{authState.user.displayName || authState.user.email || 'Guest'}
						</span>
						<button
							onclick={() => authActions.signOut()}
							class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
						>
							Sign Out
						</button>
					</div>
				{:else}
					<a
						href="/login"
						class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
					>
						Sign In
					</a>
				{/if}
			</div>
		</div>
	</nav>

	<main>{@render children()}</main>
</div>
