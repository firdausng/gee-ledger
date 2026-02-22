<script lang="ts">
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
</script>

<div class="container mx-auto p-8">
	<h1 class="text-3xl font-bold mb-6">Dashboard</h1>

	<div class="bg-white rounded-lg shadow p-6">
		<h2 class="text-xl font-semibold mb-4">Welcome back!</h2>

		<div class="space-y-3">
			<p class="text-gray-700">
				<span class="font-medium">Name:</span>
				{data.user.displayName || 'N/A'}
			</p>

			<p class="text-gray-700">
				<span class="font-medium">Email:</span>
				{data.user.email || 'N/A'}
			</p>

			<p class="text-gray-700">
				<span class="font-medium">Provider:</span>
				{data.user.provider}
			</p>

			{#if data.user.isAnonymous}
				<p class="text-amber-600 font-medium">Signed in anonymously</p>
			{/if}

			{#if data.user.photoURL}
				<div class="mt-4">
					<p class="font-medium mb-2">Profile Photo:</p>
					<img src={data.user.photoURL} alt="Profile" class="w-20 h-20 rounded-full" />
				</div>
			{/if}
		</div>
	</div>
</div>
