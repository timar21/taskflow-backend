import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { GatewayAuthController } from './auth.controller';

describe('GatewayAuthController', () => {
    let controller: GatewayAuthController;

    const mockUserServiceClient = {
        send: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        const app: TestingModule = await Test.createTestingModule({
            controllers: [GatewayAuthController],
            providers: [{ provide: 'USER_SERVICE', useValue: mockUserServiceClient }],
        }).compile();
        controller = app.get<GatewayAuthController>(GatewayAuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('login should forward credentials and return tokens', async () => {
        const tokens = { access_token: 'a', refresh_token: 'b', user: { id: 1 } };
        mockUserServiceClient.send.mockReturnValue(of(tokens));

        const result = await controller.login({ email: 'user@test.com', password: 'password123' });

        expect(mockUserServiceClient.send).toHaveBeenCalledWith('auth_login', {
            email: 'user@test.com',
            password: 'password123',
        });
        expect(result).toEqual(tokens);
    });

    it('login should convert an invalid-credentials error into a real 401', async () => {
        mockUserServiceClient.send.mockReturnValue(
            throwError(() => ({ status: 401, message: 'Invalid email or password' })),
        );
        await expect(
            controller.login({ email: 'user@test.com', password: 'wrong' }),
        ).rejects.toBeInstanceOf(HttpException);
    });

    it('refresh should forward the refresh token', async () => {
        mockUserServiceClient.send.mockReturnValue(of({ access_token: 'new' }));
        await controller.refresh({ refreshToken: 'old-token' });
        expect(mockUserServiceClient.send).toHaveBeenCalledWith('auth_refresh', {
            refreshToken: 'old-token',
        });
    });

    it('logout should forward the userId from the authenticated request', async () => {
        mockUserServiceClient.send.mockReturnValue(of({ message: 'Logged out successfully' }));
        await controller.logout({ id: 7 });
        expect(mockUserServiceClient.send).toHaveBeenCalledWith('auth_logout', { userId: 7 });
    });
});