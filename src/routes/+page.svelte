<script lang="ts">
	import logoSvg from '$lib/assets/logo.svg?raw';
</script>

<svelte:head>
	<title>Gee Ledger — Multi-Business Accounting</title>
	<meta name="description" content="Simple, fast multi-business ledger and accounting management." />
</svelte:head>

<!-- ─── Nav ────────────────────────────────────────────────────────────────── -->
<header class="sticky top-0 z-50 border-b border-border/60 backdrop-blur-sm bg-background/80">
	<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
		<span class="flex items-center gap-2 text-foreground [&_svg]:h-6 [&_svg]:w-auto">
			{@html logoSvg}
			<span class="text-lg font-semibold tracking-tight">Gee Ledger</span>
		</span>
		<div class="flex items-center gap-4">
			<a href="#features" class="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
			<a href="#pricing" class="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
			<a
				href="/login"
				class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
			>
				Sign in
			</a>
		</div>
	</div>
</header>

<!-- ─── Hero ───────────────────────────────────────────────────────────────── -->
<main>
	<section class="bg-secondary/50">
		<div class="mx-auto max-w-5xl px-6 py-24 sm:py-32 text-center">
			<p class="text-muted-foreground mb-4 text-sm font-medium tracking-widest uppercase">
				Multi-Business Ledger & Accounting
			</p>
			<h1 class="text-foreground mb-6 text-4xl sm:text-5xl font-bold tracking-tight">
				Your finances,<br />clearly organised.
			</h1>
			<p class="text-muted-foreground mx-auto mb-10 max-w-xl text-lg leading-relaxed">
				Track income, send invoices, manage products, and collaborate with your team — across all
				your businesses, from one dashboard.
			</p>
			<div class="flex flex-wrap items-center justify-center gap-3 mb-6">
				<a
					href="/login"
					class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 py-3 text-sm font-medium transition-colors"
				>
					Get started free
				</a>
				<a
					href="#features"
					class="border-border text-foreground hover:bg-accent rounded-md border px-6 py-3 text-sm font-medium transition-colors"
				>
					See what's included
				</a>
			</div>
			<p class="text-xs text-muted-foreground">Free forever · No credit card · Google sign-in</p>
		</div>
	</section>

	<!-- ─── Trust Bar ──────────────────────────────────────────────────────── -->
	<section class="border-t border-border/60 bg-background">
		<div class="mx-auto max-w-5xl px-6 py-6 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<!-- Globe icon -->
				<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/>
				</svg>
				Runs on Cloudflare
			</div>
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<!-- Zap icon -->
				<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
				</svg>
				Sub-100ms globally
			</div>
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<!-- Shield icon -->
				<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
				</svg>
				Bank-grade auth
			</div>
		</div>
	</section>

	<!-- ─── Core Features ──────────────────────────────────────────────────── -->
	<section id="features" class="border-t border-border/60">
		<div class="mx-auto max-w-5xl px-6 py-20">
			<div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
				<!-- Left: text -->
				<div>
					<p class="text-sm font-medium tracking-widest uppercase text-primary mb-2">Core Platform</p>
					<h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
						Run all your businesses from one place
					</h2>
					<p class="text-muted-foreground mb-8 leading-relaxed">
						Whether you're a freelancer with a side hustle or managing multiple ventures,
						everything lives under one roof.
					</p>

					<div class="flex flex-col gap-6">
						<!-- Multiple Businesses -->
						<div class="flex gap-4">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
								<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
									<rect x="2" y="8" width="8" height="12" rx="1"/><rect x="6" y="5" width="8" height="12" rx="1" opacity="0.5"/><rect x="10" y="2" width="8" height="12" rx="1"/><path d="M20 18a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" fill="currentColor" opacity="0.6"/><path d="M22 20h-2m-1.4-1.4 1.4 1.4"/>
								</svg>
							</div>
							<div>
								<h3 class="font-semibold text-foreground">Multiple Businesses</h3>
								<p class="text-sm text-muted-foreground leading-relaxed">Create separate ledgers for each business. Switch between them in a click.</p>
							</div>
						</div>
						<!-- Organizations -->
						<div class="flex gap-4">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
								<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
									<circle cx="12" cy="4" r="2.5"/><circle cx="5" cy="14" r="2.5"/><circle cx="19" cy="14" r="2.5"/><path d="M12 6.5V10m-4.5 1.5L10 10h4l2.5 1.5"/><circle cx="12" cy="10" r="1" fill="currentColor" opacity="0.4"/>
								</svg>
							</div>
							<div>
								<h3 class="font-semibold text-foreground">Organizations</h3>
								<p class="text-sm text-muted-foreground leading-relaxed">Group businesses under one org. Manage subscriptions and plans centrally.</p>
							</div>
						</div>
						<!-- Business Profiles -->
						<div class="flex gap-4">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
								<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
									<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2.5"/><line x1="14" y1="9" x2="19" y2="9"/><line x1="14" y1="12" x2="18" y2="12"/><line x1="7" y1="16" x2="17" y2="16" opacity="0.5"/>
								</svg>
							</div>
							<div>
								<h3 class="font-semibold text-foreground">Business Profiles</h3>
								<p class="text-sm text-muted-foreground leading-relaxed">Set currency, upload your logo, add tax ID and contact details — all in one place.</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Right: mockup -->
				<div class="rounded-xl border border-border bg-card p-5 shadow-sm">
					<p class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Businesses</p>
					<div class="space-y-2.5">
						<div class="rounded-lg border-2 border-primary/40 bg-primary/5 p-3.5 flex items-center gap-3">
							<div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
								<svg class="size-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-semibold text-foreground">Coffee & Co.</p>
								<p class="text-xs text-muted-foreground">USD · 3 members</p>
							</div>
							<span class="text-xs text-primary font-medium">Active</span>
						</div>
						<div class="rounded-lg bg-muted/50 p-3.5 flex items-center gap-3">
							<div class="size-9 rounded-lg bg-muted flex items-center justify-center">
								<svg class="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-foreground">Design Studio</p>
								<p class="text-xs text-muted-foreground">MYR · 1 member</p>
							</div>
						</div>
						<div class="rounded-lg bg-muted/50 p-3.5 flex items-center gap-3">
							<div class="size-9 rounded-lg bg-muted flex items-center justify-center">
								<svg class="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-foreground">Freelance Dev</p>
								<p class="text-xs text-muted-foreground">SGD · Just me</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ─── Financial Tracking ─────────────────────────────────────────────── -->
	<section class="bg-secondary/30">
		<div class="mx-auto max-w-5xl px-6 py-20">
			<div class="text-center mb-12">
				<p class="text-sm font-medium tracking-widest uppercase text-primary mb-2">Financial Tracking</p>
				<h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
					Know exactly where your money goes
				</h2>
				<p class="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
					Record every transaction, see the big picture on your dashboard, and export when you need it.
				</p>
			</div>

			<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
				<!-- Income & Expense -->
				<div class="rounded-lg border border-border bg-card overflow-hidden">
					<div class="h-1 bg-success-fg"></div>
					<div class="p-5">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success-bg text-success-fg mb-3">
							<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M7 17l-4-4m0 0l4-4m-4 4h14"/><path d="M17 7l4 4m0 0l-4 4m4-4H7" opacity="0.5"/><circle cx="12" cy="12" r="3"/><path d="M12 10.5v3m-1-1.5h2" stroke-width="1"/>
							</svg>
						</div>
						<h3 class="font-semibold text-foreground mb-1">Income & Expense</h3>
						<p class="text-sm text-muted-foreground leading-relaxed">Record transactions with dates, amounts, notes, references, and contacts.</p>
					</div>
				</div>

				<!-- Dashboard -->
				<div class="rounded-lg border border-border bg-card overflow-hidden">
					<div class="h-1 bg-info-fg"></div>
					<div class="p-5">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-info-bg text-info-fg mb-3">
							<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M4 20h16"/><rect x="4" y="14" width="3" height="6" rx="0.5"/><rect x="10" y="8" width="3" height="12" rx="0.5"/><rect x="16" y="11" width="3" height="9" rx="0.5"/><path d="M4 7l4-3 4 2 5-4" stroke-width="1.5"/><circle cx="17" cy="2" r="1" fill="currentColor"/>
							</svg>
						</div>
						<h3 class="font-semibold text-foreground mb-1">Dashboard</h3>
						<p class="text-sm text-muted-foreground leading-relaxed">Monthly income, expenses, and balance at a glance. Always know where you stand.</p>
					</div>
				</div>

				<!-- Filtering -->
				<div class="rounded-lg border border-border bg-card overflow-hidden">
					<div class="h-1 bg-primary"></div>
					<div class="p-5">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
							<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M3 4h18l-7 8v5l-4 2V12L3 4z"/><circle cx="18" cy="16" r="4" stroke-width="1.5"/><path d="M18 14v4m-2-2h4" stroke-width="1"/>
							</svg>
						</div>
						<h3 class="font-semibold text-foreground mb-1">Filtering</h3>
						<p class="text-sm text-muted-foreground leading-relaxed">Filter by type, date range, and more. Find any transaction in seconds.</p>
					</div>
				</div>

				<!-- Export CSV -->
				<div class="rounded-lg border border-border bg-card overflow-hidden">
					<div class="h-1 bg-warning-fg"></div>
					<div class="p-5">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-bg text-warning-fg mb-3">
							<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 13v5m-2.5-2.5L12 18l2.5-2.5"/>
							</svg>
						</div>
						<h3 class="font-semibold text-foreground mb-1">
							Export CSV
							<span class="text-xs font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary ml-1">Pro</span>
						</h3>
						<p class="text-sm text-muted-foreground leading-relaxed">Download your transactions, contacts, and accounts as CSV files.</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ─── Documents & Products ───────────────────────────────────────────── -->
	<section class="border-t border-border/60">
		<div class="mx-auto max-w-5xl px-6 py-20">
			<div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
				<!-- Left: invoice mockup -->
				<div class="order-2 lg:order-1">
					<div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
						<div class="bg-primary/5 px-5 py-3.5 flex items-center justify-between border-b border-border">
							<div>
								<p class="text-sm font-semibold text-foreground">INVOICE #001</p>
								<p class="text-xs text-muted-foreground">Coffee & Co.</p>
							</div>
							<span class="text-xs text-muted-foreground">2026-03-01</span>
						</div>
						<div class="px-5 py-4 space-y-2.5">
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Logo Design × 1</span>
								<span class="tabular-nums text-foreground">$500.00</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Brand Guidelines × 1</span>
								<span class="tabular-nums text-foreground">$300.00</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Consultation × 2hr</span>
								<span class="tabular-nums text-foreground">$200.00</span>
							</div>
							<div class="border-t border-border pt-2.5 flex justify-between font-semibold text-sm">
								<span class="text-foreground">Total</span>
								<span class="tabular-nums text-foreground">$1,000.00</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Right: text -->
				<div class="order-1 lg:order-2">
					<p class="text-sm font-medium tracking-widest uppercase text-primary mb-2">Documents & Products</p>
					<h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
						Professional documents, built in
					</h2>
					<p class="text-muted-foreground mb-8 leading-relaxed">
						Generate invoices and receipts, email them to clients, and manage your product catalog — all without leaving the app.
					</p>

					<div class="grid sm:grid-cols-2 gap-5">
						<!-- Invoices & Receipts -->
						<div class="flex gap-3">
							<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
								<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/>
								</svg>
							</div>
							<div>
								<h3 class="text-sm font-semibold text-foreground">Invoices & Receipts</h3>
								<p class="text-xs text-muted-foreground leading-relaxed">Generate, preview, and print as PDF.</p>
							</div>
						</div>
						<!-- Email Documents -->
						<div class="flex gap-3">
							<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
								<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
									<rect x="2" y="4" width="16" height="14" rx="2"/><polyline points="2 7 10 13 18 7"/><path d="M19 11l3-2v8" opacity="0.5"/><path d="M19 17l3-2"/>
								</svg>
							</div>
							<div>
								<h3 class="text-sm font-semibold text-foreground">
									Email Documents
									<span class="text-xs font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary ml-0.5">Pro</span>
								</h3>
								<p class="text-xs text-muted-foreground leading-relaxed">Send invoices and receipts directly.</p>
							</div>
						</div>
						<!-- Line Items -->
						<div class="flex gap-3">
							<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
								<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
									<line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="14" y2="14"/><circle cx="4.5" cy="6" r="1.5" fill="currentColor" opacity="0.4"/><circle cx="4.5" cy="10" r="1.5" fill="currentColor" opacity="0.4"/><circle cx="4.5" cy="14" r="1.5" fill="currentColor" opacity="0.4"/><path d="M18 13l2 1v5l-2 1-2-1v-5l2-1z" opacity="0.5"/>
								</svg>
							</div>
							<div>
								<h3 class="text-sm font-semibold text-foreground">Line Items</h3>
								<p class="text-xs text-muted-foreground leading-relaxed">Product-based and service-based items.</p>
							</div>
						</div>
						<!-- Product Catalog -->
						<div class="flex gap-3">
							<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
								<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
									<path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M3 8h18v5H3z" opacity="0.15" fill="currentColor"/><path d="M8 3v5m8-5v5"/><line x1="8" y1="16" x2="12" y2="16" opacity="0.5"/>
								</svg>
							</div>
							<div>
								<h3 class="text-sm font-semibold text-foreground">Product Catalog</h3>
								<p class="text-xs text-muted-foreground leading-relaxed">SKU, pricing, and default quantities.</p>
							</div>
						</div>
						<!-- Contact Management -->
						<div class="flex gap-3">
							<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
								<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
									<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="4" y1="6" x2="4" y2="6" stroke-width="3"/><line x1="4" y1="12" x2="4" y2="12" stroke-width="3"/><line x1="4" y1="18" x2="4" y2="18" stroke-width="3"/><circle cx="12" cy="9" r="2.5"/><path d="M8 16c0-2 1.8-3 4-3s4 1 4 3"/>
								</svg>
							</div>
							<div>
								<h3 class="text-sm font-semibold text-foreground">Contacts</h3>
								<p class="text-xs text-muted-foreground leading-relaxed">Clients, suppliers, emails, and phone numbers.</p>
							</div>
						</div>
						<!-- File Attachments -->
						<div class="flex gap-3">
							<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
								<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
									<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
									<circle cx="19" cy="5" r="2.5" fill="currentColor" opacity="0.15" stroke="none"/><path d="M18.5 3.5l1 3" stroke-width="1" opacity="0.6"/>
								</svg>
							</div>
							<div>
								<h3 class="text-sm font-semibold text-foreground">
									Attachments
									<span class="text-xs font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary ml-0.5">Pro</span>
								</h3>
								<p class="text-xs text-muted-foreground leading-relaxed">Attach files to transactions and products.</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ─── Business Setup ─────────────────────────────────────────────────── -->
	<section class="bg-secondary/30">
		<div class="mx-auto max-w-5xl px-6 py-20">
			<div class="text-center mb-12">
				<p class="text-sm font-medium tracking-widest uppercase text-primary mb-2">Business Setup</p>
				<h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
					Set up your books the right way
				</h2>
				<p class="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
					Configure accounts, categories, channels, and locations to match how you actually run your business.
				</p>
			</div>

			<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
				<!-- Chart of Accounts -->
				<div class="text-center">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-3">
						<svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M4 4v16"/><path d="M4 12h8"/><path d="M14 4v16"/><path d="M14 12h8"/><circle cx="7" cy="8" r="0.5" fill="currentColor"/><circle cx="17" cy="16" r="0.5" fill="currentColor"/>
						</svg>
					</div>
					<h3 class="font-semibold text-foreground mb-1">Chart of Accounts</h3>
					<p class="text-sm text-muted-foreground leading-relaxed">Assets, liabilities, equity, income, and expense accounts.</p>
				</div>

				<!-- Categories -->
				<div class="text-center">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-3">
						<svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor" opacity="0.4"/><path d="M22 15l-5 5" opacity="0.3" stroke-width="2"/><path d="M18 19l-5 5" opacity="0.15" stroke-width="2"/>
						</svg>
					</div>
					<h3 class="font-semibold text-foreground mb-1">Categories</h3>
					<p class="text-sm text-muted-foreground leading-relaxed">Classify income and expenses the way that makes sense.</p>
				</div>

				<!-- Sales Channels -->
				<div class="text-center">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-3">
						<svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/><path d="M19 9l2 3" opacity="0.4"/><path d="M19 13l3 1" opacity="0.4"/><path d="M20 17l2-1" opacity="0.4"/>
						</svg>
					</div>
					<h3 class="font-semibold text-foreground mb-1">Sales Channels</h3>
					<p class="text-sm text-muted-foreground leading-relaxed">Track revenue sources — online, in-store, marketplace, and more.</p>
				</div>

				<!-- Locations -->
				<div class="text-center">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-3">
						<svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><rect x="9" y="7" width="6" height="5" rx="0.5"/><path d="M10.5 12v2m3-2v2"/><path d="M9 9.5h6"/>
						</svg>
					</div>
					<h3 class="font-semibold text-foreground mb-1">Locations</h3>
					<p class="text-sm text-muted-foreground leading-relaxed">HQ, branches, warehouses — manage them all.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- ─── Collaboration ──────────────────────────────────────────────────── -->
	<section class="border-t border-border/60">
		<div class="mx-auto max-w-5xl px-6 py-20">
			<div class="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-sm">
				<div class="text-center mb-8">
					<p class="text-sm font-medium tracking-widest uppercase text-primary mb-2">
						Collaboration
						<span class="text-xs font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary ml-1">Pro</span>
					</p>
					<h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
						Work together, stay in control
					</h2>
					<p class="text-muted-foreground leading-relaxed max-w-lg mx-auto">
						Invite your team and assign granular roles. Everyone sees exactly what they need — nothing more.
					</p>
				</div>

				<div class="space-y-3">
					<div class="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
							<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M12 2l2 5h5l-4 3 1.5 5L12 12.5 7.5 15 9 10 5 7h5z"/>
							</svg>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-semibold text-foreground">Owner</p>
						</div>
						<div class="flex flex-wrap gap-1.5 shrink-0">
							<span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Full access</span>
						</div>
					</div>
					<div class="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0">
							<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4"/>
							</svg>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-semibold text-foreground">Manager</p>
						</div>
						<div class="flex flex-wrap gap-1.5 shrink-0">
							<span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">All except settings</span>
						</div>
					</div>
					<div class="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0">
							<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M12 2v6m0 8v6M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24"/>
							</svg>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-semibold text-foreground">Cashier</p>
						</div>
						<div class="flex flex-wrap gap-1.5 shrink-0">
							<span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Record transactions</span>
						</div>
					</div>
					<div class="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0">
							<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>
							</svg>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-semibold text-foreground">Viewer</p>
						</div>
						<div class="flex flex-wrap gap-1.5 shrink-0">
							<span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">View only</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ─── Pricing ────────────────────────────────────────────────────────── -->
	<section id="pricing" class="bg-secondary/30">
		<div class="mx-auto max-w-5xl px-6 py-20">
			<div class="text-center mb-12">
				<h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
					Simple pricing, no surprises
				</h2>
				<p class="text-muted-foreground max-w-xl mx-auto leading-relaxed">
					Start free. Upgrade when you need more power.
				</p>
			</div>

			<div class="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
				<!-- Free plan -->
				<div class="rounded-xl border border-border bg-card p-7">
					<h3 class="text-lg font-bold text-foreground mb-1">Free</h3>
					<div class="mb-6">
						<span class="text-3xl font-bold text-foreground">$0</span>
						<span class="text-muted-foreground text-sm ml-1">/ forever</span>
					</div>
					<ul class="space-y-2.5 mb-8">
						{#each [
							'1 business',
							'Unlimited transactions',
							'Dashboard overview',
							'Income & expense tracking',
							'Chart of accounts',
							'Categories, locations, channels',
							'Print invoices & receipts',
							'Statement generation',
							'Contact management',
							'Product catalog',
							'Dark mode'
						] as feature}
							<li class="flex items-center gap-2 text-sm text-foreground">
								<svg class="size-4 text-success-fg shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M20 6L9 17l-5-5"/>
								</svg>
								{feature}
							</li>
						{/each}
					</ul>
					<a
						href="/login"
						class="block text-center rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
					>
						Get started
					</a>
				</div>

				<!-- Pro plan -->
				<div class="rounded-xl border-2 border-primary bg-card p-7 relative">
					<span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
						Recommended
					</span>
					<h3 class="text-lg font-bold text-foreground mb-1">Pro</h3>
					<div class="mb-6">
						<span class="text-3xl font-bold text-foreground">Coming soon</span>
					</div>
					<p class="text-sm text-muted-foreground mb-4">Everything in Free, plus:</p>
					<ul class="space-y-2.5 mb-8">
						{#each [
							'Up to 5 businesses',
							'Team invitations & roles',
							'File attachments (10 MB)',
							'Email invoices & receipts',
							'Export to CSV'
						] as feature}
							<li class="flex items-center gap-2 text-sm text-foreground">
								<svg class="size-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M20 6L9 17l-5-5"/>
								</svg>
								{feature}
							</li>
						{/each}
					</ul>
					<a
						href="/login"
						class="block text-center rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
					>
						Get started free
					</a>
				</div>
			</div>
		</div>
	</section>

	<!-- ─── Final CTA ──────────────────────────────────────────────────────── -->
	<section class="bg-primary/5">
		<div class="mx-auto max-w-5xl px-6 py-24 text-center">
			<h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
				Ready to get your books in order?
			</h2>
			<p class="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
				Sign in with Google and start tracking in under a minute. It's free.
			</p>
			<a
				href="/login"
				class="inline-block bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-8 py-3 text-sm font-medium transition-colors"
			>
				Get started free
			</a>
			<p class="text-xs text-muted-foreground mt-4">No credit card required</p>
		</div>
	</section>
</main>

<!-- ─── Footer ─────────────────────────────────────────────────────────────── -->
<footer class="border-t border-border/60">
	<div class="mx-auto max-w-5xl px-6 py-8">
		<div class="flex flex-col sm:flex-row items-center justify-between gap-4">
			<div class="flex items-center gap-2 text-foreground [&_svg]:h-4 [&_svg]:w-auto">
				{@html logoSvg}
				<span class="text-sm font-semibold">Gee Ledger</span>
			</div>
			<div class="flex items-center gap-6">
				<a href="#features" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
				<a href="#pricing" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
				<a href="/privacy" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
				<a href="/terms" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
			</div>
			<div class="flex items-center gap-4 text-sm text-muted-foreground">
				<span>&copy; {new Date().getFullYear()} Gee Ledger</span>
				<span>ledger.nurzerani.com</span>
			</div>
		</div>
	</div>
</footer>
