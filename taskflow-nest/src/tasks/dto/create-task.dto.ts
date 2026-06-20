import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty({ message: 'Title is required' })
    title!: string;

    @IsNumber()
    @IsNotEmpty({ message: 'Project id is required' })
    projectId!: number;

    @IsNumber()
    @IsOptional()
    assignedUserId?: number;

    @IsBoolean()
    @IsOptional()
    completed?: boolean;
}