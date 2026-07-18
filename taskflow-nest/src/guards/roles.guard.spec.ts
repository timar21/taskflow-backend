import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: Reflector;

    const mockContext = (user: any): ExecutionContext =>
        ({
            getHandler: () => jest.fn(),
            switchToHttp: () => ({
                getRequest: () => ({ user }),
            }),
        }) as unknown as ExecutionContext;

    beforeEach(() => {
        reflector = new Reflector();
        guard = new RolesGuard(reflector);
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it('should allow access when the route has no @Roles() metadata', () => {
        jest.spyOn(reflector, 'get').mockReturnValue(undefined);
        const context = mockContext({ id: 1, role: 'user' });

        expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when the user role is in the required roles list', () => {
        jest.spyOn(reflector, 'get').mockReturnValue(['admin']);
        const context = mockContext({ id: 1, role: 'admin' });

        expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access when the user role is not in the required roles list', () => {
        jest.spyOn(reflector, 'get').mockReturnValue(['admin']);
        const context = mockContext({ id: 1, role: 'user' });

        expect(guard.canActivate(context)).toBe(false);
    });

    it('should deny access when there is no user on the request', () => {
        jest.spyOn(reflector, 'get').mockReturnValue(['admin']);
        const context = mockContext(undefined);

        expect(guard.canActivate(context)).toBe(false);
    });
});