import { ClientProxy } from '@nestjs/microservices';
import { UserMessagePatterns } from '@app/shared';
import { sendRpc } from '../send-rpc';

// This is the actual "aggregation" piece of the API gateway pattern: a task
// coming back from task-service only has a plain assignedUserId number (see
// the note in task.entity.ts on why — separate databases, no shared foreign
// key). The gateway is what stitches that back together into something a
// client can actually use, by asking user-service for the real name/email
// and merging the two responses into one.
export async function enrichTaskWithAssignedUser(
    task: any,
    userServiceClient: ClientProxy,
): Promise<any> {
    if (!task.assignedUserId) {
        return task;
    }

    try {
        const assignedUser = await sendRpc(userServiceClient, UserMessagePatterns.FIND_USER_BY_ID, {
            id: task.assignedUserId,
        });
        const { assignedUserId, ...rest } = task;
        return { ...rest, assignedUser };
    } catch {
        // If user-service is down or the user no longer exists, the
        // aggregation is a nice-to-have enhancement — it shouldn't take
        // down the whole task response. Fall back to the raw id.
        return task;
    }
}

export async function enrichTasksWithAssignedUsers(
    tasks: any[],
    userServiceClient: ClientProxy,
): Promise<any[]> {
    return Promise.all(tasks.map((task) => enrichTaskWithAssignedUser(task, userServiceClient)));
}