<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import Toaster from '$lib/components/ui/sonner/sonner.svelte';

	let { children } = $props();
</script>

<ModeWatcher />
<Toaster />

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
