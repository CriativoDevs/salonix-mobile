export const parseSlotDate = (raw: any): Date | null => {
    if (!raw) return null;
    if (raw instanceof Date) {
        return Number.isNaN(raw.getTime()) ? null : raw;
    }
    if (typeof raw === 'number') {
        const numericDate = new Date(raw);
        return Number.isNaN(numericDate.getTime()) ? null : numericDate;
    }
    if (typeof raw === 'string') {
        const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
        const parsed = new Date(normalized);
        if (!Number.isNaN(parsed.getTime())) return parsed;
        const fallback = new Date(raw);
        return Number.isNaN(fallback.getTime()) ? null : fallback;
    }
    try {
        const candidate = new Date(raw);
        return Number.isNaN(candidate.getTime()) ? null : candidate;
    } catch {
        return null;
    }
};

export const formatDateTimeRange = (start: Date | null, end: Date | null) => {
    if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
        return '--';
    }
    const endValid = end instanceof Date && !Number.isNaN(end.getTime()) ? end : null;
    try {
        const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
        const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        const datePart = dateFormatter.format(start).replace('.', '');
        const startTime = timeFormatter.format(start);
        const endTime = endValid ? timeFormatter.format(endValid) : null;
        return endTime ? `${datePart} ${startTime} - ${endTime}` : `${datePart} ${startTime}`;
    } catch {
        const base = start.toISOString?.() || String(start);
        const fallback = endValid?.toISOString?.() || (endValid ? String(endValid) : null);
        return fallback ? `${base} - ${fallback}` : base;
    }
};

export const formatCurrency = (value: number | string | undefined) => {
    if (value === undefined || value === null) return '0,00 €';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR',
    }).format(num);
};
