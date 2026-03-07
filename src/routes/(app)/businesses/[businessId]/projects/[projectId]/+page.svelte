<script lang="ts">
	import { onMount } from 'svelte';
	import { createRawSnippet } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api, formatAmount } from '$lib/client/api.svelte';
	import {
		ArrowLeft, Loader2, Plus, Trash2, Check, Pencil, X,
		FileText, ReceiptText, ExternalLink,
		Clock, UsersRound
	} from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import {
		FlexRender,
		createSvelteTable,
		renderComponent,
		renderSnippet,
	} from '$lib/components/ui/data-table';
	import {
		type ColumnDef,
		getCoreRowModel,
	} from '@tanstack/table-core';
	import DataTableTaskActions from './data-table/data-table-task-actions.svelte';

	let { data } = $props();

	type Project = {
		id: string;
		name: string;
		description: string | null;
		contactId: string | null;
		status: string;
		estimatedAmount: number;
	};
	type Task = {
		id: string;
		title: string;
		description: string | null;
		status: string;
		billingMode: string;
		estimatedCost: number;
		hourlyRate: number | null;
		actualCost: number | null;
		sortOrder: number;
		billed: boolean;
		totalTrackedMinutes: number;
		conversions: { conversionId: string; quoteId: string | null; transactionId: string | null }[];
	};
	type Conversion = {
		id: string;
		type: 'quote' | 'transaction';
		docId: string | null;
		originalAmount: number;
		originalCurrency: string;
		amount: number | null;
		date: string;
		docNo: string | null;
		note: string | null;
		createdAt: string;
	};
	type TimeEntry = {
		id: string;
		taskId: string;
		startedAt: string;
		stoppedAt: string | null;
		durationMinutes: number | null;
		note: string | null;
	};

	const businessId = $page.params.businessId!;
	const projectId = $page.params.projectId!;

	type ProjectStats = {
		transactionCount: number;
		quoteCount: number;
	};

	let project = $state<Project | null>(null);
	let tasks = $state<Task[]>([]);
	let conversions = $state<Conversion[]>([]);
	let stats = $state<ProjectStats | null>(null);
	let contactName = $state<string | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Edit project fields
	let editingName = $state(false);
	let nameInput = $state('');
	let editingDesc = $state(false);
	let descInput = $state('');
	let statusUpdating = $state(false);

	// Add task
	let newTaskTitle = $state('');
	let newTaskCost = $state('');
	let newTaskRate = $state('');
	let newTaskBillingMode = $state<'fixed' | 'hourly'>('fixed');
	let addingTask = $state(false);

	// Edit task
	let editingTaskId = $state<string | null>(null);
	let editTaskTitle = $state('');
	let editTaskCost = $state('');
	let editTaskRate = $state('');
	let editTaskBillingMode = $state<'fixed' | 'hourly'>('fixed');
	let savingTask = $state(false);

	// Time entries
	let selectedTimeTaskId = $state<string | null>(null);
	let showTimeEntriesModal = $state(false);
	let timeEntries = $state<TimeEntry[]>([]);
	let loadingEntries = $state(false);
	let manualValue = $state('');
	let manualUnit = $state<'hours' | 'minutes'>('hours');
	let manualNote = $state('');
	let addingEntry = $state(false);
	const hourlyTasks = $derived(tasks.filter((t) => t.billingMode === 'hourly'));
	const selectedTimeTask = $derived(tasks.find((t) => t.id === selectedTimeTaskId));

	// Complete hourly task modal
	let completeTask = $state<Task | null>(null);
	let completeHours = $state('');
	let completeNote = $state('');
	let completing = $state(false);

	// Convert
	let selectedTaskIds = $state<Set<string>>(new Set());
	let convertTarget = $state<'quote' | 'transaction'>('transaction');
	let convertNote = $state('');
	let converting = $state(false);
	let showConvertModal = $state(false);

	const convertableTasks = $derived(tasks.filter((t) => !t.billed && t.status === 'done'));
	const selectedTotal = $derived(
		tasks
			.filter((t) => selectedTaskIds.has(t.id))
			.reduce((sum, t) => {
				if (t.billingMode === 'hourly') {
					return sum + Math.round((t.totalTrackedMinutes / 60) * (t.hourlyRate ?? 0));
				}
				return sum + t.estimatedCost;
			}, 0)
	);

	const statusColors: Record<string, string> = {
		draft: 'bg-muted text-muted-foreground',
		active: 'bg-success-bg text-success-fg',
		'on-hold': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
		completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
		cancelled: 'bg-destructive/15 text-destructive'
	};

	function formatTime(minutes: number): string {
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return h > 0 ? `${h}h ${m}m` : `${m}m`;
	}

	// Task data table columns
	const taskColumns: ColumnDef<Task>[] = [
		{
			accessorKey: 'title',
			header: 'Task',
			cell: ({ row }) => {
				const t = row.original;
				const snippet = createRawSnippet<[{ title: string; billed: boolean }]>((getProps) => {
					const { title, billed } = getProps();
					return {
						render: () =>
							`<div class="flex items-center gap-1.5"><span class="text-foreground">${title}</span>${billed ? `<span class="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">billed</span>` : ''}</div>`,
					};
				});
				return renderSnippet(snippet, { title: t.title, billed: t.billed });
			},
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => {
				const s = row.original.status;
				const colors = s === 'done'
					? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
					: s === 'in-progress'
						? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
						: 'bg-muted text-muted-foreground';
				const label = s === 'done' ? 'Done' : s === 'in-progress' ? 'In Progress' : 'To Do';
				const snippet = createRawSnippet<[{ colors: string; label: string }]>((getProps) => {
					const { colors, label } = getProps();
					return {
						render: () => `<span class="text-[10px] font-medium px-2 py-0.5 rounded-full ${colors}">${label}</span>`,
					};
				});
				return renderSnippet(snippet, { colors, label });
			},
		},
		{
			id: 'time',
			header: 'Time',
			cell: ({ row }) => {
				const t = row.original;
				if (t.billingMode !== 'hourly') return renderSnippet(createRawSnippet(() => ({ render: () => `<span class="text-muted-foreground">—</span>` })));
				const snippet = createRawSnippet<[{ display: string }]>((getProps) => {
					const { display } = getProps();
					return {
						render: () => `<span class="text-muted-foreground whitespace-nowrap">${display}</span>`,
					};
				});
				return renderSnippet(snippet, { display: t.totalTrackedMinutes > 0 ? formatTime(t.totalTrackedMinutes) : '0m' });
			},
		},
		{
			id: 'amount',
			header: () => {
				const snippet = createRawSnippet(() => ({
					render: () => `<div class="text-right">Amount</div>`,
				}));
				return renderSnippet(snippet);
			},
			cell: ({ row }) => {
				const t = row.original;
				const currency = data.business.currency;
				let display: string;
				if (t.billingMode === 'hourly') {
					const total = Math.round((t.totalTrackedMinutes / 60) * (t.hourlyRate ?? 0));
					display = `${formatAmount(total, currency)}`;
				} else {
					display = formatAmount(t.estimatedCost, currency);
				}
				const snippet = createRawSnippet<[{ display: string }]>((getProps) => {
					const { display } = getProps();
					return {
						render: () => `<div class="text-right text-muted-foreground whitespace-nowrap">${display}</div>`,
					};
				});
				return renderSnippet(snippet, { display });
			},
		},
		{
			id: 'actions',
			header: () => {
				const snippet = createRawSnippet(() => ({
					render: () => `<div class="text-right">Action</div>`,
				}));
				return renderSnippet(snippet);
			},
			cell: ({ row }) => {
				const t = row.original;
				return renderComponent(DataTableTaskActions, {
					status: t.status,
					billed: t.billed,
					billingMode: t.billingMode,
					onStatusChange: (s: string) => toggleTaskStatus(t, s),
					onEdit: () => startEditTask(t),
					onDelete: () => deleteTask(t.id),
					onTimeEntries: t.billingMode === 'hourly' ? () => openTimeEntries(t.id) : undefined,
				});
			},
			enableHiding: false,
		},
	];

	const taskTable = createSvelteTable({
		get data() { return tasks; },
		columns: taskColumns,
		getCoreRowModel: getCoreRowModel(),
	});

	async function load() {
		try {
			loading = true;
			error = null;
			const [p, t, c, s] = await Promise.all([
				api.get<Project>(`/businesses/${businessId}/projects/${projectId}`),
				api.get<Task[]>(`/businesses/${businessId}/projects/${projectId}/tasks`),
				api.get<Conversion[]>(`/businesses/${businessId}/projects/${projectId}/conversions`),
				api.get<ProjectStats>(`/businesses/${businessId}/projects/${projectId}/stats`),
			]);
			project = p;
			tasks = t;
			conversions = c;
			stats = s;

			// Resolve contact name if project has contactId
			if (p.contactId) {
				try {
					const contact = await api.get<{ name: string }>(`/businesses/${businessId}/contacts/${p.contactId}`);
					contactName = contact.name;
				} catch { contactName = null; }
			}

			} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
		}
	}

	async function updateStatus(newStatus: string) {
		if (!project || statusUpdating) return;
		try {
			statusUpdating = true;
			await api.patch(`/businesses/${businessId}/projects/${projectId}`, { status: newStatus });
			project = { ...project, status: newStatus };
		} catch { /* ignore */ } finally {
			statusUpdating = false;
		}
	}

	async function saveName() {
		if (!project || !nameInput.trim()) return;
		await api.patch(`/businesses/${businessId}/projects/${projectId}`, { name: nameInput.trim() });
		project = { ...project, name: nameInput.trim() };
		editingName = false;
	}

	async function saveDesc() {
		if (!project) return;
		await api.patch(`/businesses/${businessId}/projects/${projectId}`, { description: descInput.trim() || null });
		project = { ...project, description: descInput.trim() || null };
		editingDesc = false;
	}

	async function addTask() {
		if (!newTaskTitle.trim() || addingTask) return;
		try {
			addingTask = true;
			const costCents = newTaskBillingMode === 'fixed' ? Math.round(parseFloat(newTaskCost || '0') * 100) : 0;
			const rateCents = newTaskBillingMode === 'hourly' ? Math.round(parseFloat(newTaskRate || '0') * 100) : null;
			const task = await api.post<Task>(`/businesses/${businessId}/projects/${projectId}/tasks`, {
				title: newTaskTitle.trim(),
				billingMode: newTaskBillingMode,
				estimatedCost: costCents,
				hourlyRate: rateCents,
				sortOrder: tasks.length,
			});
			tasks = [...tasks, { ...task, billed: false, conversions: [], totalTrackedMinutes: 0 }];
			if (project && newTaskBillingMode === 'fixed') project = { ...project, estimatedAmount: project.estimatedAmount + costCents };
			newTaskTitle = '';
			newTaskCost = '';
			newTaskRate = '';
		} catch { /* ignore */ } finally {
			addingTask = false;
		}
	}

	async function toggleTaskStatus(task: Task, next?: string) {
		const targetStatus = next ?? (task.status === 'todo' ? 'in-progress' : task.status === 'in-progress' ? 'done' : 'todo');
		// If hourly task going to done and no time tracked, prompt for hours
		if (targetStatus === 'done' && task.billingMode === 'hourly' && task.totalTrackedMinutes === 0) {
			completeTask = task;
			completeHours = '';
			completeNote = '';
			return;
		}
		await api.patch(`/businesses/${businessId}/projects/${projectId}/tasks/${task.id}`, { status: targetStatus });
		tasks = tasks.map((t) => (t.id === task.id ? { ...t, status: targetStatus } : t));
	}

	async function confirmCompleteTask() {
		if (!completeTask || completing) return;
		const hours = parseFloat(completeHours);
		if (!hours || hours <= 0) return;
		try {
			completing = true;
			const minutes = Math.round(hours * 60);
			// Add time entry
			await api.post(
				`/businesses/${businessId}/projects/${projectId}/tasks/${completeTask.id}/time-entries`,
				{ durationMinutes: minutes, note: completeNote.trim() || undefined }
			);
			// Mark as done
			await api.patch(`/businesses/${businessId}/projects/${projectId}/tasks/${completeTask.id}`, { status: 'done' });
			tasks = tasks.map((t) =>
				t.id === completeTask!.id ? { ...t, status: 'done', totalTrackedMinutes: t.totalTrackedMinutes + minutes } : t
			);
			completeTask = null;
		} catch { /* ignore */ } finally {
			completing = false;
		}
	}

	function startEditTask(task: Task) {
		editingTaskId = task.id;
		editTaskTitle = task.title;
		editTaskBillingMode = task.billingMode as 'fixed' | 'hourly';
		editTaskCost = (task.estimatedCost / 100).toFixed(2);
		editTaskRate = task.hourlyRate ? (task.hourlyRate / 100).toFixed(2) : '';
	}

	async function saveEditTask() {
		if (!editingTaskId || savingTask) return;
		try {
			savingTask = true;
			const costCents = editTaskBillingMode === 'fixed' ? Math.round(parseFloat(editTaskCost || '0') * 100) : 0;
			const rateCents = editTaskBillingMode === 'hourly' ? Math.round(parseFloat(editTaskRate || '0') * 100) : null;
			await api.patch(`/businesses/${businessId}/projects/${projectId}/tasks/${editingTaskId}`, {
				title: editTaskTitle.trim(),
				billingMode: editTaskBillingMode,
				estimatedCost: costCents,
				hourlyRate: rateCents,
			});
			const oldCost = tasks.find((t) => t.id === editingTaskId)?.estimatedCost ?? 0;
			tasks = tasks.map((t) =>
				t.id === editingTaskId ? { ...t, title: editTaskTitle.trim(), billingMode: editTaskBillingMode, estimatedCost: costCents, hourlyRate: rateCents } : t
			);
			if (project) project = { ...project, estimatedAmount: project.estimatedAmount - oldCost + costCents };
			editingTaskId = null;
		} catch { /* ignore */ } finally {
			savingTask = false;
		}
	}

	async function deleteTask(taskId: string) {
		try {
			await api.delete(`/businesses/${businessId}/projects/${projectId}/tasks/${taskId}`);
			const removed = tasks.find((t) => t.id === taskId);
			tasks = tasks.filter((t) => t.id !== taskId);
			if (project && removed) project = { ...project, estimatedAmount: project.estimatedAmount - removed.estimatedCost };
			selectedTaskIds.delete(taskId);
			selectedTaskIds = new Set(selectedTaskIds);
		} catch { /* ignore */ }
	}

	// Time entries
	function openTimeEntries(taskId: string) {
		showTimeEntriesModal = true;
		loadTimeEntries(taskId);
	}

	async function loadTimeEntries(taskId: string) {
		try {
			loadingEntries = true;
			selectedTimeTaskId = taskId;
			timeEntries = await api.get<TimeEntry[]>(
				`/businesses/${businessId}/projects/${projectId}/tasks/${taskId}/time-entries`
			);
		} catch { timeEntries = []; } finally {
			loadingEntries = false;
		}
	}

	async function addManualEntry(taskId: string) {
		const val = parseFloat(manualValue || '0');
		if (val <= 0 || addingEntry) return;
		const totalMinutes = manualUnit === 'hours' ? Math.round(val * 60) : Math.round(val);
		try {
			addingEntry = true;
			const entry = await api.post<TimeEntry>(
				`/businesses/${businessId}/projects/${projectId}/tasks/${taskId}/time-entries`,
				{ durationMinutes: totalMinutes, note: manualNote.trim() || undefined }
			);
			timeEntries = [entry, ...timeEntries];
			tasks = tasks.map((t) =>
				t.id === taskId ? { ...t, totalTrackedMinutes: t.totalTrackedMinutes + (entry.durationMinutes ?? 0) } : t
			);
			manualValue = '';
			manualNote = '';
		} catch { /* ignore */ } finally {
			addingEntry = false;
		}
	}

	async function deleteTimeEntry(entryId: string, taskId: string, minutes: number) {
		try {
			await api.delete(`/businesses/${businessId}/projects/${projectId}/time-entries/${entryId}`);
			timeEntries = timeEntries.filter((e) => e.id !== entryId);
			tasks = tasks.map((t) =>
				t.id === taskId ? { ...t, totalTrackedMinutes: Math.max(0, t.totalTrackedMinutes - minutes) } : t
			);
		} catch { /* ignore */ }
	}

	function toggleSelect(taskId: string) {
		if (selectedTaskIds.has(taskId)) {
			selectedTaskIds.delete(taskId);
		} else {
			selectedTaskIds.add(taskId);
		}
		selectedTaskIds = new Set(selectedTaskIds);
	}

	function selectAllConvertable() {
		selectedTaskIds = new Set(
			convertableTasks
				.filter((t) => !(t.billingMode === 'hourly' && t.totalTrackedMinutes === 0))
				.map((t) => t.id)
		);
	}

	async function convert() {
		if (selectedTaskIds.size === 0 || converting) return;
		try {
			converting = true;
			const result = await api.post<{ id: string; type: string }>(
				`/businesses/${businessId}/projects/${projectId}/convert`,
				{
					taskIds: [...selectedTaskIds],
					targetType: convertTarget,
					note: convertNote.trim() || undefined,
				}
			);
			if (result.type === 'quote') {
				goto(`/businesses/${businessId}/quotes/${result.id}`);
			} else {
				goto(`/businesses/${businessId}/transactions/${result.id}`);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Conversion failed';
		} finally {
			converting = false;
		}
	}

	onMount(load);
</script>

<div>
	{#if loading}
		<div class="flex justify-center py-16"><Loader2 class="size-7 animate-spin text-muted-foreground" /></div>
	{:else if error && !project}
		<p class="text-destructive text-sm text-center py-8">{error}</p>
	{:else if project}
		<!-- Header -->
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
			<div class="flex items-center gap-2 min-w-0">
				<a
					href="/businesses/{businessId}/projects"
					class="p-1 rounded text-muted-foreground hover:text-foreground shrink-0"
				>
					<ArrowLeft class="size-4" />
				</a>
				{#if editingName}
					<form onsubmit={(e) => { e.preventDefault(); saveName(); }} class="flex items-center gap-1 flex-1 min-w-0">
						<Input bind:value={nameInput} class="h-8 text-sm" />
						<Button size="sm" variant="ghost" class="h-8 px-2" type="submit"><Check class="size-3.5" /></Button>
						<Button size="sm" variant="ghost" class="h-8 px-2" onclick={() => (editingName = false)}><X class="size-3.5" /></Button>
					</form>
				{:else}
					<h2 class="text-lg font-semibold text-foreground truncate">{project.name}</h2>
					<button onclick={() => { editingName = true; nameInput = project!.name; }} class="p-1 rounded text-muted-foreground hover:text-foreground shrink-0">
						<Pencil class="size-3" />
					</button>
				{/if}
			</div>

			<div class="flex items-center gap-1.5 shrink-0">
				{#each ['draft', 'active', 'on-hold', 'completed', 'cancelled'] as s}
					<button
						class="px-2 py-1 text-xs rounded-full transition-colors {project.status === s
							? statusColors[s]
							: 'text-muted-foreground hover:bg-muted'}"
						disabled={statusUpdating}
						onclick={() => updateStatus(s)}
					>
						{s}
					</button>
				{/each}
			</div>
		</div>

		<!-- Description -->
		<div class="mb-5">
			{#if editingDesc}
				<div class="flex gap-2">
					<textarea
						bind:value={descInput}
						rows="2"
						class="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
					></textarea>
					<div class="flex flex-col gap-1">
						<Button size="sm" variant="ghost" class="h-7 px-2" onclick={saveDesc}><Check class="size-3.5" /></Button>
						<Button size="sm" variant="ghost" class="h-7 px-2" onclick={() => (editingDesc = false)}><X class="size-3.5" /></Button>
					</div>
				</div>
			{:else if project.description}
				<p class="text-sm text-muted-foreground cursor-pointer hover:text-foreground" onclick={() => { editingDesc = true; descInput = project!.description ?? ''; }}>
					{project.description}
				</p>
			{:else}
				<button class="text-xs text-muted-foreground hover:text-foreground" onclick={() => { editingDesc = true; descInput = ''; }}>
					+ Add description
				</button>
			{/if}
		</div>

		<!-- Stat cards -->
		{#if stats}
			<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
				<a
					href="/businesses/{businessId}/transactions?projectId={projectId}"
					class="rounded-lg border border-border bg-card p-3 hover:bg-muted/30 transition-colors"
				>
					<div class="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
						<ReceiptText class="size-3.5" />
						<span>Transactions</span>
					</div>
					<p class="text-lg font-bold text-foreground">{stats.transactionCount}</p>
				</a>
				<a
					href="/businesses/{businessId}/quotes?projectId={projectId}"
					class="rounded-lg border border-border bg-card p-3 hover:bg-muted/30 transition-colors"
				>
					<div class="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
						<FileText class="size-3.5" />
						<span>Quotes</span>
					</div>
					<p class="text-lg font-bold text-foreground">{stats.quoteCount}</p>
				</a>
				{#if project.contactId}
					<a
						href="/businesses/{businessId}/contacts/{project.contactId}"
						class="rounded-lg border border-border bg-card p-3 hover:bg-muted/30 transition-colors"
					>
						<div class="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
							<UsersRound class="size-3.5" />
							<span>Contact</span>
						</div>
						<p class="text-sm font-medium text-foreground truncate">{contactName ?? '...'}</p>
					</a>
				{/if}
			</div>
		{/if}

		{#if error}
			<div class="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
		{/if}

		<!-- Two-column layout -->
		<div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">

			<!-- Left: Tasks -->
			<div class="rounded-lg border border-border bg-card overflow-hidden">
				<div class="px-4 py-3 border-b border-border flex items-center justify-between">
					<h3 class="text-sm font-semibold text-foreground">Tasks</h3>
					<div class="flex items-center gap-2 text-xs text-muted-foreground">
						<span>Estimated: {formatAmount(project.estimatedAmount, data.business.currency)}</span>
					</div>
				</div>

				<!-- Add task row -->
				<form onsubmit={(e) => { e.preventDefault(); addTask(); }} class="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30 flex-wrap">
					<Plus class="size-3.5 text-muted-foreground shrink-0" />
					<Input bind:value={newTaskTitle} placeholder="New task" class="h-7 text-xs flex-1 min-w-[100px]" />
					<div class="flex items-center gap-1">
						<button type="button" onclick={() => (newTaskBillingMode = 'fixed')}
							class="px-1.5 py-0.5 text-[10px] rounded {newTaskBillingMode === 'fixed' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}">Fixed</button>
						<button type="button" onclick={() => (newTaskBillingMode = 'hourly')}
							class="px-1.5 py-0.5 text-[10px] rounded {newTaskBillingMode === 'hourly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}">Hourly</button>
					</div>
					{#if newTaskBillingMode === 'fixed'}
						<Input bind:value={newTaskCost} type="number" step="0.01" min="0" placeholder="Cost" class="h-7 text-xs w-24" />
					{:else}
						<Input bind:value={newTaskRate} type="number" step="0.01" min="0" placeholder="$/hr" class="h-7 text-xs w-24" />
					{/if}
					<Button size="sm" variant="ghost" class="h-7 px-2 text-xs" type="submit" disabled={addingTask || !newTaskTitle.trim()}>
						{#if addingTask}<Loader2 class="size-3 animate-spin" />{:else}Add{/if}
					</Button>
				</form>

				{#if tasks.length === 0}
					<div class="p-6 text-center text-sm text-muted-foreground">No tasks yet.</div>
				{:else if editingTaskId}
					<!-- Inline edit row (shown above the table) -->
					<div class="px-4 py-2.5 border-b border-border">
						<form onsubmit={(e) => { e.preventDefault(); saveEditTask(); }} class="flex items-center gap-2 flex-wrap">
							<Input bind:value={editTaskTitle} class="h-7 text-xs flex-1 min-w-[120px]" />
							<div class="flex items-center gap-1">
								<button type="button" onclick={() => (editTaskBillingMode = 'fixed')}
									class="px-1.5 py-0.5 text-[10px] rounded {editTaskBillingMode === 'fixed' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}">Fixed</button>
								<button type="button" onclick={() => (editTaskBillingMode = 'hourly')}
									class="px-1.5 py-0.5 text-[10px] rounded {editTaskBillingMode === 'hourly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}">Hourly</button>
							</div>
							{#if editTaskBillingMode === 'fixed'}
								<Input bind:value={editTaskCost} type="number" step="0.01" min="0" class="h-7 text-xs w-24" placeholder="Cost" />
							{:else}
								<Input bind:value={editTaskRate} type="number" step="0.01" min="0" class="h-7 text-xs w-24" placeholder="$/hr" />
							{/if}
							<Button size="sm" variant="ghost" class="h-7 px-1.5" type="submit" disabled={savingTask}>
								<Check class="size-3" />
							</Button>
							<Button size="sm" variant="ghost" class="h-7 px-1.5" onclick={() => (editingTaskId = null)}>
								<X class="size-3" />
							</Button>
						</form>
					</div>
				{/if}

				{#if tasks.length > 0}
					<Table.Root class="text-xs">
						<Table.Header>
							{#each taskTable.getHeaderGroups() as headerGroup (headerGroup.id)}
								<Table.Row>
									{#each headerGroup.headers as header (header.id)}
										<Table.Head class="h-8 text-xs">
											{#if !header.isPlaceholder}
												<FlexRender
													content={header.column.columnDef.header}
													context={header.getContext()}
												/>
											{/if}
										</Table.Head>
									{/each}
								</Table.Row>
							{/each}
						</Table.Header>
						<Table.Body>
							{#each taskTable.getRowModel().rows as row (row.id)}
								<Table.Row>
									{#each row.getVisibleCells() as cell (cell.id)}
										<Table.Cell>
											<FlexRender
												content={cell.column.columnDef.cell}
												context={cell.getContext()}
											/>
										</Table.Cell>
									{/each}
								</Table.Row>
							{:else}
								<Table.Row>
									<Table.Cell colspan={taskColumns.length} class="h-24 text-center">
										No tasks.
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{/if}

				{#if convertableTasks.length > 0}
					<div class="px-4 py-2.5 border-t border-border bg-muted/10">
						<Button size="sm" variant="outline" class="h-7 text-xs w-full" onclick={() => { selectedTaskIds = new Set(); convertNote = ''; convertTarget = 'transaction'; showConvertModal = true; }}>
							<ReceiptText class="size-3 mr-1.5" /> Convert to Quote or Invoice
						</Button>
					</div>
				{/if}
			</div>

			<!-- Right: Conversions -->
			<div class="rounded-lg border border-border bg-card overflow-hidden h-fit">
				<div class="px-4 py-3 border-b border-border">
					<h3 class="text-sm font-semibold text-foreground">Linked Documents</h3>
				</div>
				{#if conversions.length === 0}
					<div class="p-4 text-center text-xs text-muted-foreground">No conversions yet.</div>
				{:else}
					<div class="divide-y divide-border">
						{#each conversions as conv (conv.id)}
							<a
								href="/businesses/{businessId}/{conv.type === 'quote' ? 'quotes' : 'transactions'}/{conv.docId}"
								class="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/30 transition-colors"
							>
								{#if conv.type === 'quote'}
									<FileText class="size-3.5 text-muted-foreground shrink-0" />
								{:else}
									<ReceiptText class="size-3.5 text-muted-foreground shrink-0" />
								{/if}
								<div class="flex-1 min-w-0">
									<p class="text-xs font-medium text-foreground truncate">
										{conv.docNo ?? conv.note ?? conv.type}
									</p>
									<p class="text-[10px] text-muted-foreground">
										{new Date(conv.date || conv.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
									</p>
								</div>
								<span class="text-xs font-semibold text-foreground shrink-0">
									{formatAmount(conv.originalAmount ?? conv.amount, conv.originalCurrency ?? data.business.currency)}
								</span>
								<ExternalLink class="size-3 text-muted-foreground shrink-0" />
							</a>
						{/each}
					</div>
				{/if}
			</div>

		</div>

		<!-- Complete Hourly Task Dialog -->
		<Dialog.Root open={!!completeTask} onOpenChange={(open) => { if (!open) completeTask = null; }}>
			<Dialog.Content class="sm:max-w-sm">
				<Dialog.Header>
					<Dialog.Title>Complete Task</Dialog.Title>
					<Dialog.Description>
						Enter the total hours spent on "{completeTask?.title}".
					</Dialog.Description>
				</Dialog.Header>
				<div class="space-y-3 py-2">
					<div class="space-y-1.5">
						<label for="complete-hours" class="text-sm font-medium text-foreground">Hours</label>
						<Input id="complete-hours" bind:value={completeHours} type="number" step="0.25" min="0.25" placeholder="e.g. 2.5" class="h-8 text-sm" />
					</div>
					<div class="space-y-1.5">
						<label for="complete-note" class="text-sm font-medium text-foreground">Note (optional)</label>
						<Input id="complete-note" bind:value={completeNote} placeholder="What was done..." class="h-8 text-sm" />
					</div>
					{#if completeTask}
						<p class="text-xs text-muted-foreground">
							Rate: {formatAmount(completeTask.hourlyRate ?? 0, data.business.currency)}/hr
							{#if completeHours && parseFloat(completeHours) > 0}
								· Total: {formatAmount(Math.round(parseFloat(completeHours) * (completeTask.hourlyRate ?? 0)), data.business.currency)}
							{/if}
						</p>
					{/if}
				</div>
				<Dialog.Footer>
					<Button variant="outline" size="sm" onclick={() => (completeTask = null)}>Cancel</Button>
					<Button size="sm" onclick={confirmCompleteTask} disabled={completing || !completeHours || parseFloat(completeHours) <= 0}>
						{#if completing}<Loader2 class="size-3.5 animate-spin mr-1.5" />{/if}
						Complete
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>

		<!-- Time Entries Dialog -->
		<Dialog.Root bind:open={showTimeEntriesModal} onOpenChange={(open) => { if (!open) { selectedTimeTaskId = null; timeEntries = []; } }}>
			<Dialog.Content class="sm:max-w-lg">
				<Dialog.Header>
					<Dialog.Title class="flex items-center gap-1.5">
						<Clock class="size-4" /> Time Entries
					</Dialog.Title>
					{#if selectedTimeTask}
						<Dialog.Description>
							{selectedTimeTask.title} · {formatAmount(selectedTimeTask.hourlyRate ?? 0, data.business.currency)}/hr
						</Dialog.Description>
					{/if}
				</Dialog.Header>

				{#if loadingEntries}
					<div class="flex justify-center py-6"><Loader2 class="size-4 animate-spin text-muted-foreground" /></div>
				{:else}
					<!-- Add entry form -->
					<form onsubmit={(e) => { e.preventDefault(); addManualEntry(selectedTimeTaskId!); }} class="flex items-center gap-2">
						<div class="flex items-center">
							<Input bind:value={manualValue} type="number" step="0.25" min="0" placeholder={manualUnit === 'hours' ? '1.5' : '90'} class="h-8 text-sm w-20 rounded-r-none" />
							<button type="button" onclick={() => (manualUnit = manualUnit === 'hours' ? 'minutes' : 'hours')}
								class="h-8 px-2 text-xs border border-l-0 border-input rounded-r-md bg-muted hover:bg-accent text-muted-foreground whitespace-nowrap">
								{manualUnit === 'hours' ? 'hrs' : 'min'}
							</button>
						</div>
						<Input bind:value={manualNote} placeholder="Note (optional)" class="h-8 text-sm flex-1" />
						<Button size="sm" class="h-8 px-3 text-xs" type="submit" disabled={addingEntry || !manualValue}>
							{#if addingEntry}<Loader2 class="size-3 animate-spin" />{:else}<Plus class="size-3 mr-1" /> Add{/if}
						</Button>
					</form>

					{#if timeEntries.length === 0}
						<div class="py-6 text-center text-sm text-muted-foreground">No time entries yet.</div>
					{:else}
						<div class="overflow-x-auto max-h-64 overflow-y-auto rounded-md border border-border">
							<table class="w-full text-xs">
								<thead class="sticky top-0 bg-card">
									<tr class="border-b border-border text-left">
										<th class="px-3 py-2 font-medium text-muted-foreground">Date</th>
										<th class="px-3 py-2 font-medium text-muted-foreground">Duration</th>
										<th class="px-3 py-2 font-medium text-muted-foreground">Note</th>
										<th class="px-3 py-2 font-medium text-muted-foreground w-8"></th>
									</tr>
								</thead>
								<tbody class="divide-y divide-border">
									{#each timeEntries as entry (entry.id)}
										<tr class="hover:bg-muted/30 transition-colors">
											<td class="px-3 py-2 text-muted-foreground whitespace-nowrap">
												{new Date(entry.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
											</td>
											<td class="px-3 py-2 font-medium text-foreground whitespace-nowrap">
												{formatTime(entry.durationMinutes ?? 0)}
											</td>
											<td class="px-3 py-2 text-muted-foreground truncate max-w-[200px]">
												{entry.note ?? ''}
											</td>
											<td class="px-3 py-2">
												<button
													onclick={() => deleteTimeEntry(entry.id, selectedTimeTaskId!, entry.durationMinutes ?? 0)}
													class="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
												>
													<Trash2 class="size-3" />
												</button>
											</td>
										</tr>
									{/each}
								</tbody>
								<tfoot>
									<tr class="border-t border-border bg-muted/20">
										<td class="px-3 py-2 font-medium text-foreground">Total</td>
										<td class="px-3 py-2 font-semibold text-foreground">
											{formatTime(timeEntries.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0))}
										</td>
										<td colspan="2"></td>
									</tr>
								</tfoot>
							</table>
						</div>
					{/if}
				{/if}
			</Dialog.Content>
		</Dialog.Root>

		<!-- Convert Dialog -->
		<Dialog.Root bind:open={showConvertModal}>
			<Dialog.Content class="sm:max-w-md">
				<Dialog.Header>
					<Dialog.Title>Convert Tasks</Dialog.Title>
					<Dialog.Description>Select tasks to convert into a quote or invoice.</Dialog.Description>
				</Dialog.Header>

				<div class="space-y-4 py-2">
					<!-- Task selection -->
					<div class="space-y-1">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm font-medium text-foreground">Tasks</span>
							<button onclick={selectAllConvertable} class="text-xs text-primary hover:underline">Select all</button>
						</div>
						<div class="max-h-48 overflow-y-auto rounded-md border border-border divide-y divide-border">
							{#each convertableTasks as task (task.id)}
								{@const noTime = task.billingMode === 'hourly' && task.totalTrackedMinutes === 0}
								<label class="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 {noTime ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}">
									<input
										type="checkbox"
										checked={selectedTaskIds.has(task.id)}
										onchange={() => toggleSelect(task.id)}
										disabled={noTime}
										class="size-3.5 rounded border-border shrink-0"
									/>
									<div class="flex-1 min-w-0">
										<span class="text-sm text-foreground truncate block">{task.title}</span>
										{#if noTime}
											<span class="text-[10px] text-destructive">No time tracked</span>
										{/if}
									</div>
									<span class="text-xs text-muted-foreground shrink-0">
										{#if task.billingMode === 'hourly'}
											{formatTime(task.totalTrackedMinutes)} @ {formatAmount(task.hourlyRate ?? 0, data.business.currency)}/hr
										{:else}
											{formatAmount(task.estimatedCost, data.business.currency)}
										{/if}
									</span>
								</label>
							{/each}
						</div>
						{#if selectedTaskIds.size > 0}
							<p class="text-xs text-muted-foreground mt-1">
								{selectedTaskIds.size} selected · Total: {formatAmount(selectedTotal, data.business.currency)}
							</p>
						{/if}
					</div>

					<!-- Target type -->
					<div class="space-y-1.5">
						<span class="text-sm font-medium text-foreground">Convert to</span>
						<Select.Root type="single" bind:value={convertTarget}>
							<Select.Trigger class="h-8 text-sm w-full">
								{convertTarget === 'quote' ? 'Quote' : 'Invoice (Transaction)'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="quote">Quote</Select.Item>
								<Select.Item value="transaction">Invoice (Transaction)</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<!-- Note -->
					<div class="space-y-1.5">
						<span class="text-sm font-medium text-foreground">Note (optional)</span>
						<Input bind:value={convertNote} placeholder="Add a note..." class="h-8 text-sm" />
					</div>
				</div>

				<Dialog.Footer>
					<Button variant="outline" size="sm" onclick={() => (showConvertModal = false)}>Cancel</Button>
					<Button size="sm" onclick={convert} disabled={converting || selectedTaskIds.size === 0}>
						{#if converting}<Loader2 class="size-3.5 animate-spin mr-1.5" />{/if}
						Convert
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	{/if}
</div>
