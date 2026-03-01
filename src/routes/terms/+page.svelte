<script lang="ts">
	import logoSvg from '$lib/assets/logo.svg?raw';
</script>

<svelte:head>
	<title>Terms & Conditions — Gee Ledger</title>
</svelte:head>

<div class="min-h-screen flex flex-col bg-background">
	<!-- Nav -->
	<header class="sticky top-0 z-50 backdrop-blur-sm bg-background/80 border-b border-border/60">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
			<a href="/" class="flex items-center gap-2 text-foreground [&_svg]:h-5 [&_svg]:w-auto">
				{@html logoSvg}
				<span class="font-semibold">Gee Ledger</span>
			</a>
			<a
				href="/login"
				class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
			>
				Sign in
			</a>
		</div>
	</header>

	<!-- Content -->
	<main class="flex-1">
		<div class="mx-auto max-w-3xl px-6 py-16">
			<h1 class="text-3xl font-bold text-foreground mb-2">Terms & Conditions</h1>
			<p class="text-sm text-muted-foreground mb-10">Last updated: 1 March 2026</p>

			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				Please read these terms and conditions carefully before using Gee Ledger.
				By accessing or using the service, you agree to be bound by these terms.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">1. Acceptance of Terms</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				By signing in to or using Gee Ledger, you agree to these Terms & Conditions and our
				<a href="/privacy" class="text-primary underline hover:text-primary/80">Privacy Policy</a>.
				If you do not agree, please do not use the service.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">2. Description of Service</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				Gee Ledger is a multi-business accounting and ledger platform that helps you track income, expenses,
				invoices, receipts, products, and contacts. The service is available in a Free tier and a Pro tier.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">3. Accounts</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				You sign in using your Google account. You are responsible for maintaining the security of your account
				and for all activity that occurs under it. Each account is intended for a single individual.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">4. Acceptable Use</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">You agree not to:</p>
			<ul class="list-disc pl-5 text-sm text-muted-foreground leading-relaxed mb-4 space-y-1">
				<li>Use the service for any unlawful purpose</li>
				<li>Attempt to reverse-engineer, decompile, or disassemble the application</li>
				<li>Interfere with or disrupt the service or its infrastructure</li>
				<li>Access accounts or data belonging to other users</li>
				<li>Use automated tools to scrape or extract data from the service</li>
			</ul>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">5. Intellectual Property</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				The Gee Ledger platform, including its design, code, and branding, is owned by us.
				You retain full ownership of all data you enter into the service, including business records,
				transactions, contacts, and documents.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">6. Subscriptions & Payments</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				The Free tier is available at no cost, forever. The Pro tier will be available in the future with
				additional features and limits. Pricing for the Pro tier may change, and we will provide notice of
				any changes before they take effect.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">7. Data & Privacy</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				Your use of the service is also governed by our
				<a href="/privacy" class="text-primary underline hover:text-primary/80">Privacy Policy</a>,
				which describes how we collect, use, and protect your information.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">8. Service Availability</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				The service is provided on an "as is" and "as available" basis. While we strive for high availability
				and reliability, we do not guarantee uninterrupted or error-free operation. We may perform maintenance
				or updates that temporarily affect availability.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">9. Limitation of Liability</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				To the maximum extent permitted by law, Gee Ledger shall not be liable for any indirect, incidental,
				special, consequential, or punitive damages, including loss of profits, data, or business opportunities,
				arising from your use of or inability to use the service.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">10. Termination</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				We may suspend or terminate your access to the service if you violate these terms or engage in
				activity that harms the service or other users. You may delete your account at any time.
				Upon termination, your right to use the service ceases immediately.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">11. Changes to Terms</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				We may update these terms from time to time. Changes will be posted on this page with an updated date.
				Your continued use of the service after changes are posted constitutes your acceptance of the revised terms.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">12. Governing Law</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				These terms shall be governed by and construed in accordance with the laws of Malaysia.
				Any disputes arising from these terms or the service shall be subject to the exclusive
				jurisdiction of the courts of Malaysia.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">13. Contact</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				If you have any questions about these terms, please reach out to us at
				<strong class="text-foreground">geeledger.com</strong>.
			</p>
		</div>
	</main>

	<!-- Footer -->
	<footer class="border-t border-border/60">
		<div class="mx-auto max-w-5xl px-6 py-8">
			<div class="flex flex-col sm:flex-row items-center justify-between gap-4">
				<div class="flex items-center gap-2 text-foreground [&_svg]:h-4 [&_svg]:w-auto">
					{@html logoSvg}
					<span class="text-sm font-semibold">Gee Ledger</span>
				</div>
				<div class="flex items-center gap-6">
					<a href="/privacy" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
					<a href="/terms" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
				</div>
				<div class="flex items-center gap-4 text-sm text-muted-foreground">
					<span>&copy; {new Date().getFullYear()} Gee Ledger</span>
					<span>geeledger.com</span>
				</div>
			</div>
		</div>
	</footer>
</div>
