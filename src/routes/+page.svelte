<script lang="ts">
</script>

<svelte:head>
	<title>Gee Ledger — Multi-Business Accounting</title>
	<meta name="description" content="Simple, fast multi-business ledger and accounting management." />
</svelte:head>

<!-- Nav -->
<header class="border-border/60 border-b">
	<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
		<span class="text-foreground text-lg font-semibold tracking-tight">Gee Ledger</span>
		<a
			href="/login"
			class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
		>
			Sign in
		</a>
	</div>
</header>

<!-- Hero -->
<main>
	<section class="bg-secondary/50">
	<div class="mx-auto max-w-5xl px-6 py-24 text-center">
		<p class="text-muted-foreground mb-4 text-sm font-medium tracking-widest uppercase">
			Multi-Business Ledger
		</p>
		<h1 class="text-foreground mb-6 text-5xl font-bold tracking-tight">
			Your finances,<br />clearly organised.
		</h1>
		<p class="text-muted-foreground mx-auto mb-10 max-w-xl text-lg leading-relaxed">
			Gee Ledger lets you manage transactions, track balances, and invite team members across
			multiple businesses — all in one place.
		</p>
		<div class="flex flex-wrap items-center justify-center gap-3">
			<a
				href="/login"
				class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 py-3 text-sm font-medium transition-colors"
			>
				Get started free
			</a>
			<a
				href="/businesses"
				class="border-border text-foreground hover:bg-accent rounded-md border px-6 py-3 text-sm font-medium transition-colors"
			>
				View businesses
			</a>
		</div>
	</div>
	</section>

	<!-- Features -->
	<section class="border-border/60 border-t">
		<div class="mx-auto max-w-5xl px-6 py-20">
			<h2 class="text-foreground mb-12 text-center text-2xl font-semibold">
				Everything you need to stay on top of your books
			</h2>
			<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
				<div class="space-y-2">
					<div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">🏢</div>
					<h3 class="text-foreground font-semibold">Multiple Businesses</h3>
					<p class="text-muted-foreground text-sm leading-relaxed">
						Manage all your businesses under one account. Switch between them instantly with full
						data isolation.
					</p>
				</div>
				<div class="space-y-2">
					<div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">📒</div>
					<h3 class="text-foreground font-semibold">Transaction Ledger</h3>
					<p class="text-muted-foreground text-sm leading-relaxed">
						Record income and expenses with full audit trails. Attach receipts and notes to every
						entry.
					</p>
				</div>
				<div class="space-y-2">
					<div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">👥</div>
					<h3 class="text-foreground font-semibold">Team Access</h3>
					<p class="text-muted-foreground text-sm leading-relaxed">
						Invite team members with role-based permissions. Control exactly who can view, record,
						or approve transactions.
					</p>
				</div>
				<div class="space-y-2">
					<div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">📊</div>
					<h3 class="text-foreground font-semibold">Balance Overview</h3>
					<p class="text-muted-foreground text-sm leading-relaxed">
						See real-time balances and summaries at a glance. Know where your money is at any
						moment.
					</p>
				</div>
				<div class="space-y-2">
					<div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">🔒</div>
					<h3 class="text-foreground font-semibold">Secure by Default</h3>
					<p class="text-muted-foreground text-sm leading-relaxed">
						Google sign-in only. Every request is verified server-side — your data stays private.
					</p>
				</div>
				<div class="space-y-2">
					<div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">⚡</div>
					<h3 class="text-foreground font-semibold">Fast Everywhere</h3>
					<p class="text-muted-foreground text-sm leading-relaxed">
						Built on Cloudflare Workers. Sub-100ms responses globally, no cold starts.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA -->
	<section class="border-border/60 border-t">
		<div class="mx-auto max-w-5xl px-6 py-20 text-center">
			<h2 class="text-foreground mb-4 text-2xl font-semibold">Ready to get started?</h2>
			<p class="text-muted-foreground mb-8 text-sm">
				Sign in with your Google account. No setup required.
			</p>
			<a
				href="/login"
				class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 py-3 text-sm font-medium transition-colors"
			>
				Sign in with Google
			</a>
		</div>
	</section>
</main>

<!-- Footer -->
<footer class="border-border/60 border-t">
	<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
		<span class="text-muted-foreground text-sm">© {new Date().getFullYear()} Gee Ledger</span>
		<span class="text-muted-foreground text-sm">ledger.nurzerani.com</span>
	</div>
</footer>
