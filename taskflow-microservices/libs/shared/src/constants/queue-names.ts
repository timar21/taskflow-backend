// Queue names, plus the dead-letter arguments every party touching a
// queue must declare identically — the gateway/task-service (as clients)
// and the owning service (as the queue's declarer) both need these to
// match exactly, or RabbitMQ rejects the mismatch with 406 PRECONDITION-FAILED.
export const QueueNames = {
    USER_QUEUE: 'user_queue',
    TASK_QUEUE: 'task_queue',
    NOTIFICATION_QUEUE: 'notification_queue',
} as const;

export function buildDeadLetterQueueOptions(queueName: string) {
    return {
        durable: false,
        arguments: {
            'x-dead-letter-exchange': 'dlx',
            'x-dead-letter-routing-key': `${queueName}.dead`,
        },
    };
}