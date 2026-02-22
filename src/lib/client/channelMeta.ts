import {
	Store,
	ShoppingBag,
	ShoppingCart,
	Music,
	Facebook,
	Instagram,
	MessageCircle,
	Youtube,
	Tag
} from '@lucide/svelte';
import type { Component } from 'svelte';

export type ChannelType =
	| 'walk_in'
	| 'shopee'
	| 'lazada'
	| 'tokopedia'
	| 'tiktok'
	| 'facebook'
	| 'instagram'
	| 'whatsapp'
	| 'youtube'
	| 'custom';

export const CHANNEL_TYPES: ChannelType[] = [
	'walk_in',
	'shopee',
	'lazada',
	'tokopedia',
	'tiktok',
	'facebook',
	'instagram',
	'whatsapp',
	'youtube',
	'custom'
];

export const channelMeta: Record<ChannelType, { label: string; icon: Component }> = {
	walk_in:   { label: 'Walk-in',   icon: Store },
	shopee:    { label: 'Shopee',    icon: ShoppingBag },
	lazada:    { label: 'Lazada',    icon: ShoppingCart },
	tokopedia: { label: 'Tokopedia', icon: ShoppingBag },
	tiktok:    { label: 'TikTok',   icon: Music },
	facebook:  { label: 'Facebook',  icon: Facebook },
	instagram: { label: 'Instagram', icon: Instagram },
	whatsapp:  { label: 'WhatsApp',  icon: MessageCircle },
	youtube:   { label: 'YouTube',   icon: Youtube },
	custom:    { label: 'Custom',    icon: Tag }
};
