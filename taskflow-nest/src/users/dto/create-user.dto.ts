import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    name!: string;

    @IsEmail({}, { message: 'Email must be valid' })
    @IsNotEmpty({ message: 'Email is required' })
    email!: string;

    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    password!: string;
}