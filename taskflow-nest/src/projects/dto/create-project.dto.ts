import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateProjectDto {
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;
}