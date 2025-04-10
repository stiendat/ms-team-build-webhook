// src/lib/dateUtils.js
export function formatDateUTC7(dateString) {
    const date = new Date(dateString);

    // UTC+7 offset in milliseconds (7 hours)
    const utc7Offset = 7 * 60 * 60 * 1000;

    // Get UTC time and add 7 hours
    const utc7Time = new Date(date.getTime() + utc7Offset);

    // Format the date string
    return utc7Time.toLocaleString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    }) + ' (UTC+7)';
}