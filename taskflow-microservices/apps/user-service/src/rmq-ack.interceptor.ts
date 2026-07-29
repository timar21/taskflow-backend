import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

// With noAck: false, RabbitMQ waits for an explicit ack/nack per message —
// nothing in NestJS does this automatically. Without this interceptor,
// every message would sit "unacknowledged" forever and eventually get
// redelivered in a loop. On success we ack (message is done, remove it from
// the queue). On failure we nack with requeue=false, which — combined with
// the queue's x-dead-letter-exchange argument — routes the failed message
// to its dead-letter queue instead of retrying it forever in place.
@Injectable()
export class RmqAckInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const rmqContext = context.switchToRpc().getContext<RmqContext>();
        const channel = rmqContext.getChannelRef();
        const originalMessage = rmqContext.getMessage();

        return next.handle().pipe(
            tap(() => {
                channel.ack(originalMessage);
            }),
            catchError((error) => {
                channel.nack(originalMessage, false, false);
                return throwError(() => error);
            }),
        );
    }
}