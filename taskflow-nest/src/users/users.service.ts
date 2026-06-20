import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

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

    // Find user by email (used in auth)
    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    // Create a new user
    async create(data: { name: string; email: string }): Promise<User> {
        const newUser = this.usersRepository.create(data);
        return this.usersRepository.save(newUser);
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