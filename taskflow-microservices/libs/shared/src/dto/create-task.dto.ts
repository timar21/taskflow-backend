import { IsString, IsNotEmpty, IsInt, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
    @ApiProperty({ example: 'Write onboarding doc' })
    @IsString()
    @IsNotEmpty({ message: 'Title is required' })
    title!: string;

    @ApiProperty({ example: 1, description: 'The project this task belongs to' })
    @IsInt()
    projectId!: number;

    @ApiPropertyOptional({ example: 3, description: 'User id to assign the task to' })
    @IsOptional()
    @IsInt()
    assignedUserId?: number;

    @ApiPropertyOptional({ example: false, default: false })
    @IsOptional()
    @IsBoolean()
    completed?: boolean;
}