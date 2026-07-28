import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';

jest.mock('bcrypt');

describe('AuthService', () => {
    let service: AuthService;

    const mockUser = {
        id: 1, name: 'Selome', email: 'user@test.com', role: 'user',
        password: 'hashed-password', hashedRefreshToken: 'hashed-refresh-token',
    };

    const mockUsersService = {
        findByEmailWithPassword: jest.fn(),
        findOneWithRefreshToken: jest.fn(),
        setHashedRefreshToken: jest.fn().mockResolvedValue(undefined),
    };

    const mockJwtService = {
        sign: jest.fn().mockReturnValue('signed-jwt-token'),
        verifyAsync: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn((key: string) => {
            const values: Record<string, string> = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
            };
            return values[key];
        }),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: mockUsersService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    describe('login', () => {
        it('should throw UnauthorizedException for a nonexistent email', async () => {
            mockUsersService.findByEmailWithPassword.mockResolvedValue(null);
            await expect(service.login('nobody@test.com', 'password123')).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException for a wrong password', async () => {
            mockUsersService.findByEmailWithPassword.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            await expect(service.login('user@test.com', 'wrongpassword')).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should return tokens and the user for correct credentials', async () => {
            mockUsersService.findByEmailWithPassword.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.login('user@test.com', 'password123');

            expect(result.access_token).toBe('signed-jwt-token');
            expect(result.refresh_token).toBe('signed-jwt-token');
            expect(result.user).toEqual({ id: 1, name: 'Selome', email: 'user@test.com', role: 'user' });
            expect(mockUsersService.setHashedRefreshToken).toHaveBeenCalled();
        });
    });

    describe('refreshTokens', () => {
        it('should throw UnauthorizedException for an invalid refresh token', async () => {
            mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
            await expect(service.refreshTokens('bad-token')).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when the stored hash does not match', async () => {
            mockJwtService.verifyAsync.mockResolvedValue({ sub: 1 });
            mockUsersService.findOneWithRefreshToken.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            await expect(service.refreshTokens('old-token')).rejects.toThrow(UnauthorizedException);
        });

        it('should issue new tokens when the refresh token is valid', async () => {
            mockJwtService.verifyAsync.mockResolvedValue({ sub: 1 });
            mockUsersService.findOneWithRefreshToken.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.refreshTokens('valid-token');
            expect(result.access_token).toBe('signed-jwt-token');
            expect(mockUsersService.setHashedRefreshToken).toHaveBeenCalled();
        });

        it('should compare a SHA-256 digest of the token, not the raw token, against the stored hash', async () => {
            // Regression test: bcrypt silently truncates anything past 72 bytes,
            // and raw JWTs are longer than that with near-identical prefixes —
            // comparing the raw token directly let a rotated-out refresh token
            // keep working. Guard against ever reverting to the raw comparison.
            mockJwtService.verifyAsync.mockResolvedValue({ sub: 1 });
            mockUsersService.findOneWithRefreshToken.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await service.refreshTokens('some-refresh-token');

            const expectedDigest = crypto
                .createHash('sha256')
                .update('some-refresh-token')
                .digest('hex');
            expect(bcrypt.compare).toHaveBeenCalledWith(expectedDigest, mockUser.hashedRefreshToken);
        });
    });

    describe('logout', () => {
        it('should clear the stored refresh token', async () => {
            const result = await service.logout(1);
            expect(mockUsersService.setHashedRefreshToken).toHaveBeenCalledWith(1, null);
            expect(result).toEqual({ message: 'Logged out successfully' });
        });
    });
});