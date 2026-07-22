import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus } from '../entities/project.entity';

export class FindProjectsDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsIn(Object.values(ProjectStatus))
    status?: ProjectStatus;

    @IsOptional()
    @IsIn(['name', 'date'])
    sortBy?: 'name' | 'date';

    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    order?: 'ASC' | 'DESC';

    // How many rows to skip — page 1 = 0, page 2 = take, page 3 = take * 2, etc.
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    skip?: number;

    // Page size
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    take?: number;
}