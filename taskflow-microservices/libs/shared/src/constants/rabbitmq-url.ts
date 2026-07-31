// In local dev (no Docker), "localhost" is correct — everything runs on
// the same machine. Inside Docker Compose, each service runs in its own
// container, and "localhost" there means "this container", not the
// rabbitmq container — so it must resolve via the service name instead
// (e.g. amqp://rabbitmq:5672). RABBITMQ_URL is only ever set by
// docker-compose.yml; local dev never sets it, so the fallback keeps
// working exactly as before.
export function getRabbitMqUrl(): string {
    return process.env.RABBITMQ_URL || 'amqp://localhost:5672';
}