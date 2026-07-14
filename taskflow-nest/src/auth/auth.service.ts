import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

type SafeUser = Pick<User, 'id' | 'name' | 'email' | 'role'>;

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    // bcrypt silently truncates anything past 72 bytes, and JWTs are much longer
    // than that with mostly-identical prefixes — so we hash to a fixed-size
    // digest first, and bcrypt that digest instead of the raw token.
    private hashTokenForBcrypt(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    // Used by LocalStrategy to check email/password credentials
    async validateUser(email: string, password: string): Promise<SafeUser | null> {
        const user = await this.usersService.findByEmailWithPassword(email);
        if (!user) {
            return null;
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return null;
        }

        const { id, name, role } = user;
        return { id, name, email: user.email, role };
    }

    // Issues a fresh access + refresh token pair and stores the refresh token's hash
    private async issueTokens(user: SafeUser) {
        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };

        const access_token = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') ?? '15m',
        });

        const refresh_token = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') ?? '7d',
        });

        await this.usersService.setHashedRefreshToken(user.id, refresh_token);

        return { access_token, refresh_token };
    }

    // Called after LocalStrategy has already validated the user's credentials
    async login(user: SafeUser) {
        const tokens = await this.issueTokens(user);
        return {
            ...tokens,
            user,
        };
    }

    // Exchanges a valid, unexpired refresh token for a new token pair (rotation)
    async refreshTokens(refreshToken: string) {
        let payload: { sub: number };
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const user = await this.usersService.findOneWithRefreshToken(payload.sub);
        if (!user || !user.hashedRefreshToken) {
            throw new UnauthorizedException('Access denied');
        }

        const tokenMatches = await bcrypt.compare(
            this.hashTokenForBcrypt(refreshToken),
            user.hashedRefreshToken,
        );
        if (!tokenMatches) {
            throw new UnauthorizedException('Access denied');
        }

        const safeUser: SafeUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        const tokens = await this.issueTokens(safeUser);
        return { ...tokens, user: safeUser };
    }

    // Clears the stored refresh token so it can no longer be used
    async logout(userId: number): Promise<{ message: string }> {
        await this.usersService.setHashedRefreshToken(userId, null);
        return { message: 'Logged out successfully' };
    }
}