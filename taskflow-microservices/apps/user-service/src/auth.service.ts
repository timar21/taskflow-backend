import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

type SafeUser = Pick<User, 'id' | 'name' | 'email' | 'role'>;

// Same logic as the monolith's AuthService — the only real difference is
// login() now does the credential check itself (email/password in one
// message), since there's no local Passport LocalStrategy guard running
// in-process anymore. The gateway just forwards the raw credentials here.
@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    private async validateUser(email: string, password: string): Promise<SafeUser | null> {
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

    async login(email: string, password: string) {
        const user = await this.validateUser(email, password);
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }
        const tokens = await this.issueTokens(user);
        return { ...tokens, user };
    }

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
            crypto.createHash('sha256').update(refreshToken).digest('hex'),
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

    async logout(userId: number): Promise<{ message: string }> {
        await this.usersService.setHashedRefreshToken(userId, null);
        return { message: 'Logged out successfully' };
    }
}