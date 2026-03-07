import * as v from 'valibot';

const ProjectStatusSchema = v.picklist(['draft', 'active', 'on-hold', 'completed', 'cancelled']);
const TaskStatusSchema = v.picklist(['todo', 'in-progress', 'done']);
const BillingModeSchema = v.picklist(['fixed', 'hourly']);

export const CreateProjectSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
	description: v.optional(v.pipe(v.string(), v.maxLength(2000))),
	contactId: v.optional(v.string()),
	status: v.optional(ProjectStatusSchema, 'draft'),
});

export const UpdateProjectSchema = v.object({
	name: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
	description: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(2000)))),
	contactId: v.optional(v.nullable(v.string())),
	status: v.optional(ProjectStatusSchema),
});

export const ProjectFiltersSchema = v.object({
	status: v.optional(ProjectStatusSchema),
	contactId: v.optional(v.string()),
	page: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 1),
	perPage: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
});

export const CreateProjectTaskSchema = v.object({
	title: v.pipe(v.string(), v.minLength(1), v.maxLength(500)),
	description: v.optional(v.pipe(v.string(), v.maxLength(2000))),
	status: v.optional(TaskStatusSchema, 'todo'),
	billingMode: v.optional(BillingModeSchema, 'fixed'),
	estimatedCost: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 0),
	hourlyRate: v.optional(v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0)))),
	sortOrder: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 0),
});

export const UpdateProjectTaskSchema = v.object({
	title: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(500))),
	description: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(2000)))),
	status: v.optional(TaskStatusSchema),
	billingMode: v.optional(BillingModeSchema),
	estimatedCost: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
	hourlyRate: v.optional(v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0)))),
	actualCost: v.optional(v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0)))),
	sortOrder: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
});

export const ConvertProjectSchema = v.object({
	taskIds: v.pipe(v.array(v.pipe(v.string(), v.minLength(1))), v.minLength(1)),
	targetType: v.picklist(['quote', 'transaction']),
	note: v.optional(v.pipe(v.string(), v.maxLength(500))),
});

export const CreateTimeEntrySchema = v.object({
	durationMinutes: v.pipe(v.number(), v.integer(), v.minValue(1)),
	note: v.optional(v.pipe(v.string(), v.maxLength(500))),
});

export type CreateTimeEntryInput = v.InferOutput<typeof CreateTimeEntrySchema>;
export type CreateProjectInput = v.InferOutput<typeof CreateProjectSchema>;
export type UpdateProjectInput = v.InferOutput<typeof UpdateProjectSchema>;
export type ProjectFilters = v.InferOutput<typeof ProjectFiltersSchema>;
export type CreateProjectTaskInput = v.InferOutput<typeof CreateProjectTaskSchema>;
export type UpdateProjectTaskInput = v.InferOutput<typeof UpdateProjectTaskSchema>;
export type ConvertProjectInput = v.InferOutput<typeof ConvertProjectSchema>;
