import { NotFoundException } from '@nestjs/common';
import { RpcExceptionFilter } from './rpc-exception.filter';

describe('RpcExceptionFilter', () => {
    let filter: RpcExceptionFilter;

    beforeEach(() => {
        filter = new RpcExceptionFilter();
    });

    it('should convert an HttpException into a { status, message } error', (done) => {
        const exception = new NotFoundException('User with id 99 not found');

        filter.catch(exception, {} as any).subscribe({
            error: (err) => {
                expect(err).toEqual({ status: 404, message: 'User with id 99 not found' });
                done();
            },
        });
    });

    it('should convert an unknown error into a generic 500', (done) => {
        filter.catch(new Error('boom'), {} as any).subscribe({
            error: (err) => {
                expect(err).toEqual({ status: 500, message: 'Internal server error' });
                done();
            },
        });
    });
    it('should convert a Postgres unique-violation error into a 409 Conflict', (done) => {
        const dbError = { code: '23505', message: 'duplicate key value violates unique constraint' };

        filter.catch(dbError, {} as any).subscribe({
            error: (err) => {
                expect(err).toEqual({ status: 409, message: 'Email is already in use' });
                done();
            },
        });
    });
});