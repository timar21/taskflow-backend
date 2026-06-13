import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    async login(email: string, password: string) {
        // Find user by email
        const users = this.usersService.findAll();
        const user = users.find(u => u.email === email);

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // For now we use a simple password check
        // In real apps you would hash passwords with bcrypt
        if (password !== '123456') {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Generate JWT token
        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        };
    }
}