/**
 * Deterministically formats a date to "DD/MM/YYYY" format using UTC coordinates.
 */
export const formatLocalDate = (dateInput: Date | string | number): string => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
};
