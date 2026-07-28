import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { throwError, Observable } from 'rxjs';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, _host: ArgumentsHost): Observable<never> {
        if (exception instanceof HttpException) {
            return throwError(() => ({
                status: exception.getStatus(),
                message: exception.message,
            }));
        }
        return throwError(() => ({
            status: 500,
            message: 'Internal server error',
        }));
    }
}