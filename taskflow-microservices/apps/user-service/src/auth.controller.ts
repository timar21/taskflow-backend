import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class UserServiceAuthController {
    constructor(private readonly authService: AuthService) { }

    @MessagePattern('auth_login')
    login(@Payload() data: { email: string; password: string }) {
        return this.authService.login(data.email, data.password);
    }

    @MessagePattern('auth_refresh')
    refresh(@Payload() data: { refreshToken: string }) {
        return this.authService.refreshTokens(data.refreshToken);
    }

    @MessagePattern('auth_logout')
    logout(@Payload() data: { userId: number }) {
        return this.authService.logout(data.userId);
    }
}