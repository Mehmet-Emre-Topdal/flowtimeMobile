/**
 * Safely extracts a user-facing error message from an unknown error value.
 * Handles RTK Query CUSTOM_ERROR shape: { status: 'CUSTOM_ERROR', error: string }
 * Falls back to `fallback` for any other error type.
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
    if (
        err !== null &&
        typeof err === 'object' &&
        'error' in err &&
        typeof (err as Record<string, unknown>).error === 'string'
    ) {
        return (err as { error: string }).error;
    }
    return fallback;
}
