import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
    @ApiProperty({ example: 'TaskFlow API', description: 'The name of the project' })
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    name!: string;

    @ApiPropertyOptional({ example: 'Backend for the TaskFlow app' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        example: 5,
        description: 'User id to own the project. Admin-only field — defaults to the creating admin if omitted.',
    })
    @IsOptional()
    ownerId?: number;
}