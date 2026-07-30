import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthMessagePatterns } from '@app/shared';
import { AuthService } from './auth.service';

@Controller()
export class UserServiceAuthController {
    constructor(private readonly authService: AuthService) { }

    @MessagePattern(AuthMessagePatterns.LOGIN)
    login(@Payload() data: { email: string; password: string }) {
        return this.authService.login(data.email, data.password);
    }

    @MessagePattern(AuthMessagePatterns.REFRESH)
    refresh(@Payload() data: { refreshToken: string }) {
        return this.authService.refreshTokens(data.refreshToken);
    }

    @MessagePattern(AuthMessagePatterns.LOGOUT)
    logout(@Payload() data: { userId: number }) {
        return this.authService.logout(data.userId);
    }
}