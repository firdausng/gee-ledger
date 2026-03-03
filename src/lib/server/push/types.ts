export interface PushMessage {
	title: string;
	body: string;
	data?: Record<string, string>;
	actionUrl?: string;
}

export interface PushSendResult {
	token: string;
	success: boolean;
	error?: string;
	/** true if token is permanently invalid and should be removed */
	invalidToken?: boolean;
}

export interface PushProvider {
	/** Send push notification to multiple device tokens */
	sendToTokens(tokens: string[], message: PushMessage): Promise<PushSendResult[]>;
}
