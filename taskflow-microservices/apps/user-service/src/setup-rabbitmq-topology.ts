import * as amqp from 'amqplib';
import { getRabbitMqUrl } from '@app/shared';
// RabbitMQ won't dead-letter a message into thin air — the dead-letter
// exchange and the dead-letter queue bound to it both have to exist BEFORE
// any message tries to route there, or a rejected message is just silently
// dropped. This runs once at startup and declares that topology directly,
// since NestJS's microservice transport only ever asserts the one queue it
// actually listens on.
export async function setupDeadLetterQueue(mainQueueName: string): Promise<void> {
    const connection = await amqp.connect(getRabbitMqUrl());
    const channel = await connection.createChannel();

    const dlxExchange = 'dlx';
    const dlqName = `${mainQueueName}.dlq`;
    const deadLetterRoutingKey = `${mainQueueName}.dead`;

    await channel.assertExchange(dlxExchange, 'direct', { durable: false });
    await channel.assertQueue(dlqName, { durable: false });
    await channel.bindQueue(dlqName, dlxExchange, deadLetterRoutingKey);

    await channel.close();
    await connection.close();
}