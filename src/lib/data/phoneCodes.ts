export const PHONE_CODES = [
	{ code: '+1',   flag: '🇺🇸', country: 'US / Canada' },
	{ code: '+7',   flag: '🇷🇺', country: 'Russia' },
	{ code: '+20',  flag: '🇪🇬', country: 'Egypt' },
	{ code: '+27',  flag: '🇿🇦', country: 'South Africa' },
	{ code: '+33',  flag: '🇫🇷', country: 'France' },
	{ code: '+34',  flag: '🇪🇸', country: 'Spain' },
	{ code: '+39',  flag: '🇮🇹', country: 'Italy' },
	{ code: '+40',  flag: '🇷🇴', country: 'Romania' },
	{ code: '+41',  flag: '🇨🇭', country: 'Switzerland' },
	{ code: '+44',  flag: '🇬🇧', country: 'United Kingdom' },
	{ code: '+45',  flag: '🇩🇰', country: 'Denmark' },
	{ code: '+46',  flag: '🇸🇪', country: 'Sweden' },
	{ code: '+47',  flag: '🇳🇴', country: 'Norway' },
	{ code: '+48',  flag: '🇵🇱', country: 'Poland' },
	{ code: '+49',  flag: '🇩🇪', country: 'Germany' },
	{ code: '+52',  flag: '🇲🇽', country: 'Mexico' },
	{ code: '+55',  flag: '🇧🇷', country: 'Brazil' },
	{ code: '+60',  flag: '🇲🇾', country: 'Malaysia' },
	{ code: '+61',  flag: '🇦🇺', country: 'Australia' },
	{ code: '+62',  flag: '🇮🇩', country: 'Indonesia' },
	{ code: '+63',  flag: '🇵🇭', country: 'Philippines' },
	{ code: '+64',  flag: '🇳🇿', country: 'New Zealand' },
	{ code: '+65',  flag: '🇸🇬', country: 'Singapore' },
	{ code: '+66',  flag: '🇹🇭', country: 'Thailand' },
	{ code: '+81',  flag: '🇯🇵', country: 'Japan' },
	{ code: '+82',  flag: '🇰🇷', country: 'South Korea' },
	{ code: '+84',  flag: '🇻🇳', country: 'Vietnam' },
	{ code: '+86',  flag: '🇨🇳', country: 'China' },
	{ code: '+90',  flag: '🇹🇷', country: 'Turkey' },
	{ code: '+91',  flag: '🇮🇳', country: 'India' },
	{ code: '+92',  flag: '🇵🇰', country: 'Pakistan' },
	{ code: '+94',  flag: '🇱🇰', country: 'Sri Lanka' },
	{ code: '+95',  flag: '🇲🇲', country: 'Myanmar' },
	{ code: '+234', flag: '🇳🇬', country: 'Nigeria' },
	{ code: '+254', flag: '🇰🇪', country: 'Kenya' },
	{ code: '+351', flag: '🇵🇹', country: 'Portugal' },
	{ code: '+353', flag: '🇮🇪', country: 'Ireland' },
	{ code: '+358', flag: '🇫🇮', country: 'Finland' },
	{ code: '+380', flag: '🇺🇦', country: 'Ukraine' },
	{ code: '+420', flag: '🇨🇿', country: 'Czech Republic' },
	{ code: '+852', flag: '🇭🇰', country: 'Hong Kong' },
	{ code: '+880', flag: '🇧🇩', country: 'Bangladesh' },
	{ code: '+886', flag: '🇹🇼', country: 'Taiwan' },
	{ code: '+966', flag: '🇸🇦', country: 'Saudi Arabia' },
	{ code: '+971', flag: '🇦🇪', country: 'UAE' },
	{ code: '+972', flag: '🇮🇱', country: 'Israel' },
	{ code: '+973', flag: '🇧🇭', country: 'Bahrain' },
	{ code: '+974', flag: '🇶🇦', country: 'Qatar' },
	{ code: '+977', flag: '🇳🇵', country: 'Nepal' },
] as const;

export function parsePhone(phone: string): { code: string; number: string } {
	if (!phone) return { code: '+1', number: '' };
	if (phone.startsWith('+')) {
		for (const len of [4, 3, 2]) {
			const candidate = phone.slice(0, len);
			if (PHONE_CODES.some((p) => p.code === candidate)) {
				return { code: candidate, number: phone.slice(len).trimStart() };
			}
		}
	}
	return { code: '+1', number: phone };
}
