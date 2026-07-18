import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
    let strategy: JwtStrategy;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [JwtStrategy],
        }).compile();

        strategy = module.get<JwtStrategy>(JwtStrategy);
    });

    it('should be defined', () => {
        expect(strategy).toBeDefined();
    });

    it('should map a valid token payload onto the request user shape', async () => {
        const payload = {
            sub: 1,
            email: 'user@test.com',
            name: 'Timar',
            role: 'user',
        };

        const result = await strategy.validate(payload);

        expect(result).toEqual({
            id: 1,
            email: 'user@test.com',
            name: 'Timar',
            role: 'user',
        });
    });

    it('should carry through an admin role unchanged', async () => {
        const payload = {
            sub: 2,
            email: 'admin@test.com',
            name: 'Admin',
            role: 'admin',
        };

        const result = await strategy.validate(payload);

        expect(result.role).toBe('admin');
    });
});