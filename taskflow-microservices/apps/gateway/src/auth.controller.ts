import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthMessagePatterns, LoginDto, RefreshTokenDto } from '@app/shared';
import { sendRpc } from './send-rpc';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class GatewayAuthController {
    constructor(@Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy) { }

    @ApiOperation({ summary: 'Log in with email and password' })
    @ApiResponse({ status: 201, description: 'Returns an access token, a refresh token, and the user' })
    @ApiResponse({ status: 401, description: 'Invalid email or password' })
    @Post('login')
    async login(@Body() body: LoginDto) {
        return sendRpc(this.userServiceClient, AuthMessagePatterns.LOGIN, body);
    }

    @ApiOperation({ summary: 'Exchange a valid refresh token for a new access/refresh token pair' })
    @ApiResponse({ status: 201, description: 'Returns a new access token and refresh token' })
    @ApiResponse({ status: 401, description: 'Invalid, expired, or already-rotated refresh token' })
    @Post('refresh')
    async refresh(@Body() body: RefreshTokenDto) {
        return sendRpc(this.userServiceClient, AuthMessagePatterns.REFRESH, {
            refreshToken: body.refreshToken,
        });
    }

    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Log out — invalidates the current refresh token' })
    @ApiResponse({ status: 201, description: 'Logged out successfully' })
    @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout(@CurrentUser() user: { id: number }) {
        return sendRpc(this.userServiceClient, AuthMessagePatterns.LOGOUT, { userId: user.id });
    }
}