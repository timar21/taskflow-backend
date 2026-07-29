import { HttpException, RequestTimeoutException, ServiceUnavailableException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timer } from 'rxjs';
import { retry, timeout } from 'rxjs/operators';

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 500;
const RESPONSE_TIMEOUT_MS = 5000;

// A {status, message} error is a real business error produced by the
// service's own RpcExceptionFilter (404 not found, 403 forbidden, 409
// conflict, etc.) — retrying won't change that answer, so it's surfaced
// immediately. Anything else — connection refused, no response in time —
// is treated as transient and retried with exponential backoff (500ms,
// 1000ms, 2000ms) before finally giving up.
function isBusinessError(error: unknown): error is { status: number; message: string } {
    return typeof error === 'object' && error !== null && 'status' in error;
}

export async function sendRpc<T>(
    client: ClientProxy,
    pattern: string,
    data: unknown,
): Promise<T> {
    try {
        return await firstValueFrom(
            client.send<T>(pattern, data).pipe(
                timeout(RESPONSE_TIMEOUT_MS),
                retry({
                    count: MAX_RETRIES,
                    delay: (error, retryCount) => {
                        if (isBusinessError(error)) {
                            throw error;
                        }
                        return timer(INITIAL_DELAY_MS * 2 ** (retryCount - 1));
                    },
                }),
            ),
        );
    } catch (error: any) {
        if (isBusinessError(error)) {
            throw new HttpException(error.message ?? 'Internal server error', error.status ?? 500);
        }
        if (error?.name === 'TimeoutError') {
            throw new RequestTimeoutException('The service did not respond in time');
        }
        throw new ServiceUnavailableException('Service temporarily unavailable, please try again');
    }
}