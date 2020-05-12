export interface SubscriptionDriver {
    createSubscription(channel: string, observer): boolean; // TODO Maybe void instead?
    destroySubscription(channel: string): void;
}
