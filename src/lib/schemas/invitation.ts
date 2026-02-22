import * as v from 'valibot';
import type { PolicyKey } from '$lib/configurations/policies';

const PolicyKeySchema = v.picklist(['owner', 'manager', 'cashier', 'viewer'] as const);

export const InviteUserSchema = v.object({
	email: v.pipe(v.string(), v.email()),
	policyKey: PolicyKeySchema
});

export const UpdateMemberRoleSchema = v.object({
	policyKey: PolicyKeySchema
});

export type InviteUserInput = v.InferOutput<typeof InviteUserSchema>;
export type UpdateMemberRoleInput = v.InferOutput<typeof UpdateMemberRoleSchema>;
export type { PolicyKey };
