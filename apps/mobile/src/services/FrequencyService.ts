import { getSetting } from '@/repositories/SettingsRepository';

export const DEFAULT_FREQUENCY_CHAIN = [
    '1 day',
    '2 days',
    '4 days',
    '8 days',
    '16 days',
    '1 month',
    '2 months',
    '4 months',
    '1 year',
];

export const parseFrequencyToDays = (freq: string): number => {
    if (!freq) return 0;
    const parts = freq.trim().split(' ');
    const n = parseInt(parts[0]);
    if (isNaN(n)) return 1;
    const unit = (parts[1] || 'days').toLowerCase();

    // Cleanup unit pluralization
    const cleanUnit = unit.endsWith('s') ? unit.slice(0, -1) : unit;

    switch (cleanUnit) {
        case 'day':
            return n;
        case 'week':
            return n * 7;
        case 'month':
            return n * 30;
        case 'year':
            return n * 365;
        default:
            return n;
    }
};

export const getFrequencyChain = async (): Promise<string[]> => {
    const stored = await getSetting('frequency_chain');
    let chain = DEFAULT_FREQUENCY_CHAIN;
    if (stored) {
        chain = stored.split(',').map((s) => s.trim()).filter(Boolean);
    }

    // Ensure it's sorted by days
    return chain.sort((a, b) => parseFrequencyToDays(a) - parseFrequencyToDays(b));
};

export const formatDaysToFrequency = (days: number): string => {
    if (days === 0) return 'Unscheduled';
    if (days % 365 === 0) return `${days / 365} year${days / 365 > 1 ? 's' : ''}`;
    if (days % 30 === 0) return `${days / 30} month${days / 30 > 1 ? 's' : ''}`;
    if (days % 7 === 0) return `${days / 7} week${days / 7 > 1 ? 's' : ''}`;
    return `${days} day${days > 1 ? 's' : ''}`;
};

export const getNextFrequencyInterval = async (
    currentDays: number,
    direction: 'more' | 'less'
): Promise<number> => {
    const chainStrings = await getFrequencyChain();
    const chainDays = chainStrings.map(parseFrequencyToDays);

    // Add current days if not in chain to find nearest
    // But actually, we want to find the next/prev element relative to where we are or would be.

    if (direction === 'more') {
        // We want a SMALLER interval (more frequent reviews)
        const smaller = chainDays.filter(d => d < currentDays).sort((a, b) => b - a);
        return smaller.length > 0 ? smaller[0] : Math.max(1, Math.round(currentDays / 2));
    } else {
        // We want a LARGER interval (less frequent reviews)
        const larger = chainDays.filter(d => d > currentDays).sort((a, b) => a - b);
        return larger.length > 0 ? larger[0] : currentDays * 2;
    }
};
