import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthMessagePatterns, RefreshTokenDto } from '@app/shared';
import { sendRpc } from './send-rpc';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

// Login and refresh need no local guard — the credentials (or refresh
// token) themselves are what gets verified, remotely, by user-service.
// Logout is different: it needs to know WHO is logging out, which the
// gateway can already tell from a valid access token, so JwtAuthGuard runs
// locally first and CurrentUser pulls the id straight off the token.
@Controller('auth')
export class GatewayAuthController {
    constructor(@Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy) { }

    @Post('login')
    async login(@Body() body: { email: string; password: string }) {
        return sendRpc(this.userServiceClient, AuthMessagePatterns.LOGIN, body);
    }

    @Post('refresh')
    async refresh(@Body() body: RefreshTokenDto) {
        return sendRpc(this.userServiceClient, AuthMessagePatterns.REFRESH, {
            refreshToken: body.refreshToken,
        });
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout(@CurrentUser() user: { id: number }) {
        return sendRpc(this.userServiceClient, AuthMessagePatterns.LOGOUT, { userId: user.id });
    }
}