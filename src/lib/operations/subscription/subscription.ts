import { Operation } from '../operation';
import { Buoy } from '../../buoy';
import { SubscriptionOptions } from './subscription-options';
import { Subscription as rxjsSubscription } from 'rxjs';
import { scope } from 'ngx-plumber';

export class Subscription extends Operation {
    protected _apolloOperation;
    protected _apolloSubscription: rxjsSubscription;

    /**
     * Contains the latest data.
     */
    private data: any;

    constructor(
        buoy: Buoy,
        id: number,
        query,
        variables,
        options: SubscriptionOptions
    ) {
        super(buoy, id, query, variables, options, 'subscription');

        this.initSubscription();

        return this;
    }

    public unsubscribe() {
        // TODO
    }

    public refetch() {
        // TODO
    }

    protected initSubscription() {
        if (typeof this._buoy.config.subscriptions === 'undefined') {
            throw new Error('You must select a subscription-driver before subscribing.');
        }

        this._apolloOperation = this._buoy.apollo.subscribe({
            query: this.getQuery(),
            variables: this.getVariables(),
            fetchPolicy: this.getFetchPolicy()
        });

        this._apolloSubscription = this._apolloOperation.subscribe((data) => this.handleEvent(data));

        this.emitOnInitialized();
    }

    private handleEvent(data): void {
        this.data = scope(data.data, this._options.scope);

        this.emitOnChange();
    }

    private emitOnInitialized() {
        if (typeof this._options.onInitialized !== 'undefined') {
            this._options.onInitialized(this._id);
        }
    }

    private emitOnChange() {
        if (typeof this._options.onChange !== 'undefined') {
            this._options.onChange(this._id, this.data);
        }
    }
}
