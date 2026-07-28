import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// Verifies an access token's signature locally, using the same JWT_SECRET
// user-service used to sign it — no RabbitMQ round trip needed here, since
// a valid JWT is self-contained proof of identity. This is the one part of
// auth that stays entirely in the gateway rather than calling user-service.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') ?? 'myjwtsecretkey456',
        });
    }

    async validate(payload: { sub: number; email: string; name: string; role: string }) {
        return {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            role: payload.role,
        };
    }
}