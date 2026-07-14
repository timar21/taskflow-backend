import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateProjectDto {
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;

    // Admin-only: assign the project to a specific user. Defaults to the creating admin if omitted.
    @IsInt()
    @IsOptional()
    ownerId?: number;
}