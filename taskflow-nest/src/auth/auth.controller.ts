import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

export class RefreshTokenDto {
    @IsString()
    @IsNotEmpty({ message: 'Refresh token is required' })
    refreshToken!: string;
}

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // LocalStrategy runs first (validates email/password), req.user is the safe user it returns
    @UseGuards(LocalAuthGuard)
    @Post('login')
    login(@Request() req: any) {
        return this.authService.login(req.user);
    }

    @Post('refresh')
    refresh(@Body() body: RefreshTokenDto) {
        return this.authService.refreshTokens(body.refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    logout(@CurrentUser() user: { id: number }) {
        return this.authService.logout(user.id);
    }
}
