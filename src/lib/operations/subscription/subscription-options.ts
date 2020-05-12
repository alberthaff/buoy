import { WatchQuery } from '../watch-query/watch-query';

export interface SubscriptionOptions {
    scope: string;

    // Callbacks
    onInitialized?: (id: number) => void;
    onChange: (id: number, data: any) => void;
}
