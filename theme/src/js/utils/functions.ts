export function formatTime(milliseconds: number, padFirst: boolean = false): string {
    if (!milliseconds || isNaN(milliseconds)) {
        return '00:00';
    }
    let seconds = String(Math.floor(milliseconds / 1000));
    let minutes = String(Math.floor(parseInt(seconds) / 60));
    seconds = String(parseInt(seconds) % 60).padStart(2, '0');
    if (parseInt(minutes) < 60) {
        if (padFirst) {
            minutes = String(minutes).padStart(2, '0');
        }
        return `${minutes}:${seconds}`;
    }
    let hours = String(Math.floor(parseInt(minutes) / 60));
    minutes = String(parseInt(minutes) % 60).padStart(2, '0');
    if (padFirst) {
        hours = String(hours).padStart(2, '0');
    }
    return `${hours}:${minutes}:${seconds}`;
}