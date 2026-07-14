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

    // Get all users
    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    // Get one user by id
    async findOne(id: number): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        return user;
    }

    // Find user by email (used in auth) - no password included
    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    // Find user by email including the hashed password (password column has select:false)
    async findByEmailWithPassword(email: string): Promise<User | null> {
        return this.usersRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email })
            .getOne();
    }

    // Get one user by id including the hashed refresh token (for validating refresh requests)
    async findOneWithRefreshToken(id: number): Promise<User | null> {
        return this.usersRepository
            .createQueryBuilder('user')
            .addSelect('user.hashedRefreshToken')
            .where('user.id = :id', { id })
            .getOne();
    }

    // Create a new user (password is hashed before storage)
    async create(data: { name: string; email: string; password: string }): Promise<User> {
        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
        const newUser = this.usersRepository.create({
            ...data,
            password: hashedPassword,
        });
        return this.usersRepository.save(newUser);
    }

    // Store the hashed refresh token for a user (called on login/refresh)
    async setHashedRefreshToken(userId: number, refreshToken: string | null): Promise<void> {
        const hashedRefreshToken = refreshToken
            ? await bcrypt.hash(crypto.createHash('sha256').update(refreshToken).digest('hex'), SALT_ROUNDS)
            : null;
        await this.usersRepository.update(userId, { hashedRefreshToken });
    }

    // Update an existing user
    async update(
        id: number,
        data: Partial<{ name: string; email: string }>,
    ): Promise<User> {
        const user = await this.findOne(id);
        Object.assign(user, data);
        return this.usersRepository.save(user);
    }

    // Delete a user
    async remove(id: number): Promise<{ message: string }> {
        const user = await this.findOne(id);
        await this.usersRepository.remove(user);
        return { message: `User with id ${id} deleted successfully` };
    }
}