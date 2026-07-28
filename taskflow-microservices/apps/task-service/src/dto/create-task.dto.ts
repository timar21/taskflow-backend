import { IsString, IsNotEmpty, IsInt, IsOptional, IsBoolean } from 'class-validator';

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty({ message: 'Title is required' })
    title!: string;

    @IsInt()
    projectId!: number;

    @IsOptional()
    @IsInt()
    assignedUserId?: number;

    @IsOptional()
    @IsBoolean()
    completed?: boolean;
}