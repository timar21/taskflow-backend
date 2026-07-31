import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'Selome', description: "The user's display name" })
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    name!: string;

    @ApiProperty({ example: 'user@test.com', description: "The user's email address" })
    @IsEmail({}, { message: 'Email must be valid' })
    @IsNotEmpty({ message: 'Email is required' })
    email!: string;

    @ApiProperty({ example: 'password123', minLength: 6, description: 'Minimum 6 characters' })
    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    password!: string;
}