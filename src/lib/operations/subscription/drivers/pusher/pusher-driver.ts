import { PusherDriverOptions } from './pusher-driver-options';
import { SubscriptionDriver } from '../subscription-driver';
import Pusher from 'pusher-js';

export class PusherDriver implements SubscriptionDriver {
    private pusher;

    constructor(options: PusherDriverOptions) {
        this.pusher = new Pusher(options.appKey, options.pusherOptions);
    }

    createSubscription(subscriptionChannel: string, observer): boolean {
        const pusherChannel = this.pusher.subscribe(subscriptionChannel);

        pusherChannel.bind('lighthouse-subscription', payload => {

            if (!payload.more) {
                this.pusher.unsubscribe(subscriptionChannel);
                observer.complete();
            }
            const result = payload.result;

            if (result) {
                observer.next(result);
            }
        });

        return false;
    }

    destroySubscription(channel: string): void {
        // TODO
    }
}
