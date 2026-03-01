<script lang="ts">
	import logoSvg from '$lib/assets/logo.svg?raw';
</script>

<svelte:head>
	<title>Privacy Policy — Gee Ledger</title>
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
			<h1 class="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
			<p class="text-sm text-muted-foreground mb-10">Last updated: 1 March 2026</p>

			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				Gee Ledger ("we", "our", or "us") operates the ledger.nurzerani.com website and application.
				This page explains what information we collect, how we use it, and your rights regarding your data.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">1. Information We Collect</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				When you sign in with Google, we receive your name, email address, and profile photo from your Google account.
				We also store the business and financial data you enter into the application, such as transactions, contacts, products, and invoices.
			</p>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				We may collect basic usage data such as pages visited and actions taken within the app to help us understand how the service is used.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">2. How We Use Your Information</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">We use your information to:</p>
			<ul class="list-disc pl-5 text-sm text-muted-foreground leading-relaxed mb-4 space-y-1">
				<li>Provide and maintain the Gee Ledger service</li>
				<li>Authenticate your identity via Google sign-in</li>
				<li>Improve the platform based on usage patterns</li>
				<li>Communicate important changes to the service</li>
			</ul>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">3. Data Storage</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				Your data is stored on Cloudflare's global infrastructure. All data in transit is encrypted using HTTPS.
				We use Cloudflare D1 as our database, which runs on Cloudflare's edge network.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">4. Third-Party Services</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">We use the following third-party services:</p>
			<ul class="list-disc pl-5 text-sm text-muted-foreground leading-relaxed mb-4 space-y-1">
				<li><strong class="text-foreground">Google</strong> — for authentication (sign-in with Google)</li>
				<li><strong class="text-foreground">Cloudflare</strong> — for hosting, database, and content delivery</li>
			</ul>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				These services have their own privacy policies that govern how they handle your data.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">5. Data Sharing</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				We do not sell, trade, or rent your personal information to anyone.
				We may share your data only when required to comply with applicable law, regulation, or legal process.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">6. Your Rights</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">You have the right to:</p>
			<ul class="list-disc pl-5 text-sm text-muted-foreground leading-relaxed mb-4 space-y-1">
				<li>Access the personal data we hold about you</li>
				<li>Correct inaccurate data</li>
				<li>Request deletion of your account and data</li>
				<li>Export your data via CSV (available on the Pro plan)</li>
			</ul>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				To exercise any of these rights, please contact us using the details below.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">7. Cookies</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				Gee Ledger uses only essential cookies for authentication purposes (Firebase auth token).
				We do not use tracking cookies, analytics cookies, or any third-party advertising cookies.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">8. Changes to This Policy</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				We may update this privacy policy from time to time. Changes will be posted on this page with an updated date.
				Your continued use of the service after changes are posted constitutes your acceptance of the updated policy.
			</p>

			<h2 class="text-xl font-semibold text-foreground mt-10 mb-3">9. Contact</h2>
			<p class="text-sm text-muted-foreground leading-relaxed mb-4">
				If you have any questions about this privacy policy or your data, please reach out to us at
				<strong class="text-foreground">ledger.nurzerani.com</strong>.
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
					<span>ledger.nurzerani.com</span>
				</div>
			</div>
		</div>
	</footer>
</div>
