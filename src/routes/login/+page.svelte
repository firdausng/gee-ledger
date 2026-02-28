<script lang="ts">
	import { authState, authActions } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { Loader2 } from '@lucide/svelte';

	let signingIn = $state(false);

	$effect(() => {
		if (authState.user) {
			goto('/businesses');
		}
	});

	async function handleSignIn() {
		signingIn = true;
		try {
			await authActions.signInWithGoogle();
		} finally {
			signingIn = false;
		}
	}
</script>

<svelte:head>
	<title>Sign in — Gee Ledger</title>
</svelte:head>

<div class="min-h-screen flex flex-col bg-background">
	<!-- Nav -->
	<header class="border-b border-border/60">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
			<a href="/" class="text-foreground text-lg font-semibold tracking-tight">Gee Ledger</a>
		</div>
	</header>

	<!-- Content -->
	<main class="flex-1 flex items-center justify-center px-6 py-16">
		<div class="w-full max-w-sm">
			<div class="text-center mb-8">
				<div class="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-6 text-primary">
						<rect width="18" height="18" x="3" y="3" rx="2" />
						<path d="M3 9h18" />
						<path d="M3 15h18" />
						<path d="M9 3v18" />
					</svg>
				</div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Welcome back</h1>
				<p class="text-muted-foreground text-sm mt-1.5">Sign in to manage your businesses</p>
			</div>

			{#if authState.error}
				<div class="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
					{authState.error}
				</div>
			{/if}

			<div class="rounded-lg border border-border bg-card p-6 shadow-sm">
				<button
					onclick={handleSignIn}
					disabled={signingIn}
					class="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-md border border-border bg-background text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50"
				>
					{#if signingIn}
						<Loader2 class="size-5 animate-spin" />
						Signing in…
					{:else}
						<svg class="size-5" viewBox="0 0 24 24">
							<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
							<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
							<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
							<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
						</svg>
						Continue with Google
					{/if}
				</button>

				<p class="text-xs text-muted-foreground text-center mt-4">
					By signing in, you agree to our terms of service.
				</p>
			</div>

			<p class="text-xs text-muted-foreground text-center mt-6">
				No account? One will be created automatically.
			</p>
		</div>
	</main>

	<!-- Footer -->
	<footer class="border-t border-border/60">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
			<span class="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} Gee Ledger</span>
			<span class="text-muted-foreground text-sm">ledger.nurzerani.com</span>
		</div>
	</footer>
</div>
