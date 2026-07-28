import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) { }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async findOne(id: number): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        return user;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findByEmailWithPassword(email: string): Promise<User | null> {
        return this.usersRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email })
            .getOne();
    }

    async findOneWithRefreshToken(id: number): Promise<User | null> {
        return this.usersRepository
            .createQueryBuilder('user')
            .addSelect('user.hashedRefreshToken')
            .where('user.id = :id', { id })
            .getOne();
    }

    async create(data: { name: string; email: string; password: string }): Promise<User> {
        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
        const newUser = this.usersRepository.create({
            ...data,
            password: hashedPassword,
        });
        const savedUser = await this.usersRepository.save(newUser);

        // save() returns the in-memory entity it just persisted, which includes
        // every field we set — @Column({ select: false }) only omits a column
        // from generated SELECT queries, it does nothing here. Strip sensitive
        // fields by hand before this ever leaves the service.
        const { password, hashedRefreshToken, ...safeUser } = savedUser;
        return safeUser as User;
    }

    // bcrypt silently truncates anything past 72 bytes, and JWTs are much
    // longer than that with mostly-identical prefixes (same header, same
    // sub/email/name/role fields) — so every refresh token for a user would
    // hash to something bcrypt treats as identical. Hash to a fixed-size
    // SHA-256 digest first, and bcrypt that instead of the raw token.
    async setHashedRefreshToken(userId: number, refreshToken: string | null): Promise<void> {
        const hashedRefreshToken = refreshToken
            ? await bcrypt.hash(crypto.createHash('sha256').update(refreshToken).digest('hex'), SALT_ROUNDS)
            : null;
        await this.usersRepository.update(userId, { hashedRefreshToken });
    }

    async update(
        id: number,
        data: Partial<{ name: string; email: string }>,
    ): Promise<User> {
        const user = await this.findOne(id);
        Object.assign(user, data);
        return this.usersRepository.save(user);
    }

    async remove(id: number): Promise<{ message: string }> {
        const user = await this.findOne(id);
        await this.usersRepository.remove(user);
        return { message: `User with id ${id} deleted successfully` };
    }
}