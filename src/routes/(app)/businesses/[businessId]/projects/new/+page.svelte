<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api } from '$lib/client/api.svelte';
	import { ArrowLeft, Loader2 } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';

	type Contact = { id: string; name: string; isClient: boolean; isSupplier: boolean };

	const businessId = $page.params.businessId!;

	let contacts = $state<Contact[]>([]);
	let loadingMeta = $state(true);

	let name = $state('');
	let description = $state('');
	let contactId = $state('');
	let status = $state('draft');

	let submitting = $state(false);
	let submitError = $state<string | null>(null);

	let clientContacts = $derived(contacts.filter((c) => c.isClient));

	async function loadMeta() {
		try {
			loadingMeta = true;
			contacts = await api.get<Contact[]>(`/businesses/${businessId}/contacts`);
		} catch { /* non-critical */ } finally {
			loadingMeta = false;
		}
	}

	async function submit() {
		if (!name.trim()) return;
		try {
			submitting = true;
			submitError = null;
			const project = await api.post<{ id: string }>(`/businesses/${businessId}/projects`, {
				name: name.trim(),
				description: description.trim() || undefined,
				contactId: contactId || undefined,
				status,
			});
			goto(`/businesses/${businessId}/projects/${project.id}`);
		} catch (e) {
			submitError = e instanceof Error ? e.message : 'Failed to create project';
		} finally {
			submitting = false;
		}
	}

	onMount(loadMeta);
</script>

<div>
	<a
		href="/businesses/{businessId}/projects"
		class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
	>
		<ArrowLeft class="size-3.5" />
		Back to Projects
	</a>

	<h2 class="text-lg font-semibold text-foreground mb-5">New Project</h2>

	{#if submitError}
		<div class="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{submitError}</div>
	{/if}

	<Card.Root class="max-w-lg">
		<Card.Content class="flex flex-col gap-4 pt-5">
			<div class="space-y-1.5">
				<Label for="p-name">Project Name <span class="text-destructive">*</span></Label>
				<Input id="p-name" type="text" bind:value={name} placeholder="e.g. Website Redesign" />
			</div>

			<div class="space-y-1.5">
				<Label for="p-desc">Description</Label>
				<textarea
					id="p-desc"
					bind:value={description}
					placeholder="Optional description"
					rows="3"
					class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				></textarea>
			</div>

			<div class="space-y-1.5">
				<Label>Status</Label>
				<Select.Root type="single" bind:value={status}>
					<Select.Trigger>
						{status.charAt(0).toUpperCase() + status.slice(1)}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="draft">Draft</Select.Item>
						<Select.Item value="active">Active</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>

			<div class="space-y-1.5">
				<Label>Client</Label>
				{#if loadingMeta}
					<div class="h-9 rounded-md border border-input bg-muted animate-pulse"></div>
				{:else}
					<Select.Root type="single" bind:value={contactId}>
						<Select.Trigger>
							{contactId ? clientContacts.find((c) => c.id === contactId)?.name : 'No client'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">No client</Select.Item>
							{#each clientContacts as c (c.id)}
								<Select.Item value={c.id}>{c.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>

	<div class="flex justify-end gap-2 mt-4">
		<Button href="/businesses/{businessId}/projects" variant="ghost" size="sm">Cancel</Button>
		<Button size="sm" onclick={submit} disabled={submitting || !name.trim()}>
			{#if submitting}<Loader2 class="size-4 animate-spin" />{/if}
			Create Project
		</Button>
	</div>
</div>
