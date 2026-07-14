import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ActivityLog extends Document {
    @Prop({ required: true })
    action!: string;

    @Prop()
    details?: string;

    @Prop()
    userId?: number;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);