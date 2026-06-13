import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEmail({}, { message: 'Email must be valid' })
    @IsOptional()
    email?: string;
}