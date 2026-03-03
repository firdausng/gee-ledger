export const NOTIFICATION_TYPE = {
	INVITATION_RECEIVED: 'invitation_received',
	MEMBER_JOINED: 'member_joined',
	MEMBER_LEFT: 'member_left',
	TRANSACTION_CREATED: 'transaction_created',
	SUBSCRIPTION_CHANGED: 'subscription_changed'
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const ALL_NOTIFICATION_TYPES: NotificationType[] = Object.values(NOTIFICATION_TYPE);

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
	invitation_received: 'Invitation received',
	member_joined: 'Member joined a business',
	member_left: 'Member left a business',
	transaction_created: 'Transaction created',
	subscription_changed: 'Subscription changes'
};
