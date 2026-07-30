// The shape every service gets on incoming messages that need to know who's
// asking — the gateway attaches this from the verified JWT payload before
// forwarding a request over RabbitMQ, so services never see a raw token.
export interface RequestUser {
    id: number;
    role: string;
}