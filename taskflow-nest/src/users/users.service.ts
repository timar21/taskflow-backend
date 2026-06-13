import { Injectable, NotFoundException } from '@nestjs/common';

export interface User {
    id: number;
    name: string;
    email: string;
}

@Injectable()
export class UsersService {
    private users: User[] = [
        { id: 1, name: 'Timar', email: 'timar@example.com' },
        { id: 2, name: 'Tizazu', email: 'tizazu@example.com' },
    ];

    // Get all users
    findAll(): User[] {
        return this.users;
    }

    // Get one user by id
    findOne(id: number): User {
        const user = this.users.find(u => u.id === id);
        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        return user;
    }

    // Create a new user
    create(data: { name: string; email: string }): User {
        const newUser: User = {
            id: this.users.length + 1,
            name: data.name,
            email: data.email,
        };
        this.users.push(newUser);
        return newUser;
    }

    // Update an existing user
    update(id: number, data: Partial<{ name: string; email: string }>): User {
        const user = this.findOne(id);
        if (data.name) user.name = data.name;
        if (data.email) user.email = data.email;
        return user;
    }

    // Delete a user
    remove(id: number): { message: string } {
        const index = this.users.findIndex(u => u.id === id);
        if (index === -1) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        this.users.splice(index, 1);
        return { message: `User with id ${id} deleted successfully` };
    }
}