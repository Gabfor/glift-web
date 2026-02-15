export const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
};

export const validateDateParts = (
    day: string,
    month: string,
    year: string
): string => {
    if (!month) return day;

    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);

    // If day is invalid or empty, return as is (let other validation handle it if needed)
    if (isNaN(dayNum) || dayNum <= 0) return day;

    // If year is present, use it. If not, use a leap year (e.g. 2024) to allow 29th Feb temporarily
    // This avoids correcting 29/02 to 28/02 just because year is not yet selected.
    // However, user requirement is "31 fevrier -> 28 fevrier".
    // If year is not selected, we can't know if 29 is valid for Feb.
    // Standard UX: if year is missing, assume leap year to be permissive until year is chosen?
    // OR: if year is missing, assume non-leap?
    // Let's use 2024 (leap) if year is missing, to be less annoying.
    const yearNum = year ? parseInt(year, 10) : 2024;

    const maxDays = getDaysInMonth(monthNum, yearNum);

    if (dayNum > maxDays) {
        return String(maxDays).padStart(2, '0');
    }

    return day;
};
