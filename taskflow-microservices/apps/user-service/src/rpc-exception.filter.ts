import { ArgumentsHost, Catch, ConflictException, ExceptionFilter, HttpException } from '@nestjs/common';
import { throwError, Observable } from 'rxjs';

// Standard NestJS exceptions (NotFoundException, etc.) don't automatically
// carry their HTTP status across a RabbitMQ message reply — without this,
// they arrive at the gateway as a generic error and turn into a 500 no
// matter what actually went wrong. This filter catches every exception
// thrown inside a @MessagePattern handler and sends back a plain
// { status, message } object instead, which the gateway can map back
// onto a real HTTP status.
@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, _host: ArgumentsHost): Observable<never> {
        if (exception instanceof HttpException) {
            return throwError(() => ({
                status: exception.getStatus(),
                message: exception.message,
            }));
        }

        // Postgres unique-constraint violations (duplicate email, etc.) come
        // through as a raw driver error, not a NestJS HttpException — code
        // 23505 is Postgres's "unique_violation". Translate it into a real
        // 409 Conflict instead of letting it fall through to a bare 500.
        if (this.isUniqueViolation(exception)) {
            const conflict = new ConflictException('Email is already in use');
            return throwError(() => ({
                status: conflict.getStatus(),
                message: conflict.message,
            }));
        }

        return throwError(() => ({
            status: 500,
            message: 'Internal server error',
        }));
    }

    private isUniqueViolation(exception: unknown): boolean {
        return (
            typeof exception === 'object' &&
            exception !== null &&
            'code' in exception &&
            (exception as { code: unknown }).code === '23505'
        );
    }
}