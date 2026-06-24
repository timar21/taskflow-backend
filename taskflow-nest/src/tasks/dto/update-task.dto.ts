import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateTaskDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsBoolean()
    @IsOptional()
    completed?: boolean;

    @IsNumber()
    @IsOptional()
    assignedUserId?: number;
}