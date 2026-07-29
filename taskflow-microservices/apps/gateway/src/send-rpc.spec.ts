import { HttpException, ServiceUnavailableException } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { sendRpc } from './send-rpc';

describe('sendRpc', () => {
    it('should return the result when the call succeeds on the first try', async () => {
        const mockClient = { send: jest.fn().mockReturnValue(of({ id: 1 })) };
        const result = await sendRpc(mockClient as any, 'find_user_by_id', { id: 1 });
        expect(result).toEqual({ id: 1 });
        expect(mockClient.send).toHaveBeenCalledTimes(1);
    });

    it('should NOT retry a business error ({status, message}) — surface it immediately', async () => {
        const mockClient = {
            send: jest.fn().mockReturnValue(throwError(() => ({ status: 404, message: 'Not found' }))),
        };

        await expect(sendRpc(mockClient as any, 'find_user_by_id', { id: 999 })).rejects.toBeInstanceOf(
            HttpException,
        );
        expect(mockClient.send).toHaveBeenCalledTimes(1);
    });

    it('should retry a transient error and succeed once the service recovers', async () => {
        // A real ClientProxy.send() returns a COLD observable — every time it's
        // subscribed (including by retry()), it redispatches a fresh message
        // over RabbitMQ. This models that: client.send() is called once by our
        // code, but each retry resubscribes to this same observable, which
        // re-runs its dispatch logic (the counter below) on every subscription.
        let attempts = 0;
        const flaky = new Observable((subscriber) => {
            attempts += 1;
            if (attempts < 3) {
                subscriber.error(new Error('connection refused'));
            } else {
                subscriber.next({ id: 1 });
                subscriber.complete();
            }
        });
        const mockClient = { send: jest.fn().mockReturnValue(flaky) };

        const result = await sendRpc(mockClient as any, 'find_user_by_id', { id: 1 });

        expect(result).toEqual({ id: 1 });
        expect(attempts).toBe(3);
        expect(mockClient.send).toHaveBeenCalledTimes(1);
    }, 10000);

    it('should give up after exhausting retries on a persistent transient error', async () => {
        let attempts = 0;
        const alwaysFails = new Observable((subscriber) => {
            attempts += 1;
            subscriber.error(new Error('connection refused'));
        });
        const mockClient = { send: jest.fn().mockReturnValue(alwaysFails) };

        await expect(sendRpc(mockClient as any, 'find_user_by_id', { id: 1 })).rejects.toBeInstanceOf(
            ServiceUnavailableException,
        );
        expect(attempts).toBe(4); // 1 initial attempt + 3 retries
        expect(mockClient.send).toHaveBeenCalledTimes(1);
    }, 10000);
});