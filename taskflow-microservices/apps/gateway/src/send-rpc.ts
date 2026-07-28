import { HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

// Sends a message and waits for the reply, same as calling
// firstValueFrom(client.send(...)) directly — except it also converts a
// { status, message } error (thrown by RpcExceptionFilter on the service
// side) back into a real NestJS HttpException, so a 404 from user-service
// actually reaches the browser as a 404, not a generic 500.
export async function sendRpc<T>(
    client: ClientProxy,
    pattern: string,
    data: unknown,
): Promise<T> {
    try {
        return await firstValueFrom(client.send<T>(pattern, data));
    } catch (error: any) {
        throw new HttpException(error?.message ?? 'Internal server error', error?.status ?? 500);
    }
}