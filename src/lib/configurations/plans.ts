import type { Permission } from './policies';

// ── Plan keys ────────────────────────────────────────────────────────────────

export type PlanKey = 'free' | 'pro';

export const PLAN_KEY = {
	FREE: 'free',
	PRO:  'pro',
} as const satisfies Record<string, PlanKey>;

// ── Subscription statuses ────────────────────────────────────────────────────

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due';

export const SUBSCRIPTION_STATUS = {
	ACTIVE:    'active',
	CANCELLED: 'cancelled',
	PAST_DUE:  'past_due',
} as const satisfies Record<string, SubscriptionStatus>;

// ── Organization member roles ────────────────────────────────────────────────

export type OrgMemberRole = 'owner' | 'admin' | 'member';

export const ORG_ROLE = {
	OWNER:  'owner',
	ADMIN:  'admin',
	MEMBER: 'member',
} as const satisfies Record<string, OrgMemberRole>;

// ── Plan definitions ─────────────────────────────────────────────────────────

export interface PlanDefinition {
	name: string;
	features: Permission[];
	limits: {
		maxBusinesses: number; // -1 = unlimited
		maxAttachmentSizeMb: number;
	};
}

export const PLANS: Record<PlanKey, PlanDefinition> = {
	[PLAN_KEY.FREE]: {
		name: 'Free',
		features: [],
		limits: { maxBusinesses: 1, maxAttachmentSizeMb: 0 },
	},
	[PLAN_KEY.PRO]: {
		name: 'Pro',
		features: ['attachment:upload', 'attachment:delete', 'transaction:email', 'transaction:export', 'user:invite'],
		limits: { maxBusinesses: 5, maxAttachmentSizeMb: 10 },
	},
};

// Permissions that require a paid plan feature (checked in addition to role permission)
export const PLAN_GATED_PERMISSIONS: Set<Permission> = new Set(
	Object.values(PLANS).flatMap((p) => p.features)
);
