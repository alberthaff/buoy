import { BehaviorSubject, Subscription } from 'rxjs';
import { scope } from 'ngx-plumber';
import { Buoy } from '../../buoy';
import { Pagination } from './pagination';
import { WatchQueryOptions } from './watch-query-options';
import { WatchQuerySubscription } from './watch-query-subscription';
import { Operation } from '../operation';
import { Subscription as BuoySubscription } from '../subscription/subscription';
import { SubscriptionOptions } from '../subscription/subscription-options';
import { QueryResult } from '../query/query-result';
import { QueryError } from '../query/query-error';

export class WatchQuery extends Operation {
    protected _apolloSubscription: Subscription;
    private _pagination: Pagination;

    private _buoySubscription: BuoySubscription;

    /**
     * Contains the Buoy Subscription
     */
    protected subscription: WatchQuerySubscription;

    public _apolloInitialized = new BehaviorSubject(false);

    public data: any;

    /**
     * Whether or not the WatchQuery is currently loading.
     */
    public loading = true;

    /**
     * Is the WatchQuery ready?
     * By default, this will mirror the value of `loading`, but it is possible to set this value to false and have
     * it change back to true, when the next fetch has finished.
     */
    public ready = false;

    constructor(
        buoy: Buoy,
        id: number,
        query,
        variables,
        options: WatchQueryOptions
    ) {
        super(buoy, id, query, variables, options, 'query');

        // Init QueryPagination
        if (this.paginationEnabled) {
            this._pagination = new Pagination(this, super.getQuery(), this._options, this._variables);
        }

        if (this._options.fetch !== false) {
            this.initQuery();
        }

        if (this._options.subscribe !== false) {
            // this.subscription = new WatchQuerySubscription(this.getQuery()); // TODO
        }

        return this;
    }

    public get pagination(): any {
        return this._pagination.pagination;
    }

    public refetch(): this {
        this.loading = true;
        if (this._apolloInitialized.value === false) {
            if (this._options.fetch === false) {
                this.initQuery();
            } else {
                this._apolloInitialized.toPromise().then(initialized => {
                    this.doRefetch();
                });
            }
        } else {
            this.doRefetch();
        }

        if (typeof this._buoySubscription !== 'undefined') {
            this._buoySubscription.refetch();
        }

        return this;
    }

    private doRefetch() {
        this.emitOnLoadingStart();
        this.loading = true;
        this._apolloOperation.refetch(this.getVariables()).then(
            (success) => {
                this.loading = false;
            },
            (error) => {
                this.loading = false;
                console.log('BUOY REFETCHED FAILED');
            }
        );
    }

    /**
     * Set variable value.
     */
    public setVariable(variable: string, value: any): this {
        this._variables[variable] = value;

        return this;
    }

    /**
     * Go to the previous page.
     */
    public prevPave(refetch = true, paginator?: string): this {
        if (!this.paginationEnabled) {
            throw new Error('Pagination must be enabled before the page can be changed.');
        }
        if (refetch === true && this._pagination.prevPage(paginator)) {
            this.refetch();
        }

        return this;
    }

    /**
     * Go the the next page.
     */
    public nextPage(refetch = true, paginator?: string): this {
        if (!this.paginationEnabled) {
            throw new Error('Pagination must be enabled before the page can be changed.');
        }
        if (refetch === true && this._pagination.nextPage(paginator)) {
            this.refetch();
        }

        return this;
    }

    /**
     * Set the page.
     */
    public setPage(page: number, refetch = true, paginator?: string): this {
        if (!this.paginationEnabled) {
            throw new Error('Pagination must be enabled before the page can be changed.');
        }
        if (refetch === true && this._pagination.setPage(page, paginator)) {
            this.refetch();
        }

        return this;
    }

    /**
     * Set the limit.
     */
    public setLimit(limit: number, refetch = true, paginator?: string): this {
        if (!this.paginationEnabled) {
            throw new Error('Pagination must be enabled before the limit can be changed.');
        }
        this._pagination.setLimit(limit, paginator);

        if (refetch === true) {
            this.refetch();
        }

        return this;
    }

    /**
     * Destroy the Query.
     */
    public destroy(): void {
        if (this._pagination) {
            // TODO Also destroy this._pagination.destroy();
        }
        this._apolloSubscription.unsubscribe();
    }

    /**
     * @deprecated
     */
    public reset(): void {
        // Hotfix to trigger Angular's listeners.
        for (const key of Object.keys(this.data)) {
            delete this.data[key];
        }
    }

    public getVariables() {
        if (this.paginationEnabled) {
            // Inject variables from Pagination
            return Object.assign(super.getVariables(), this._pagination.variables);
        }

        return super.getVariables();
    }

    protected initQuery() {
        this._apolloOperation = this._buoy.apollo.watchQuery({
            query: this.getQuery(),
            variables: this.getVariables(),
            fetchPolicy: this.getFetchPolicy(),
            notifyOnNetworkStatusChange: true
        });

        // Subscribe to changes
        this._apolloSubscription = this._apolloOperation.valueChanges.subscribe(({data, loading}) => this.mapResponse(data, loading));

        this.emitOnLoadingStart();

        console.log('BUOY REF 2 INIT');

        this._apolloInitialized.next(true);
        this.emitOnInitialized();
    }

    protected mapResponse(data, loading): void {
        console.log('BUOY MAP', data, loading);
        // Set loading
        this.loading = loading; // TODO Necessary?

        if (this.paginationEnabled) {
            this._pagination.readPaginationFromResponse(data);
        }

        // Set data
        this.data = scope(data, this._options.scope);

        console.log('BUOY DAT', data, this.data, this._options.scope);

        this.emitOnLoadingFinish();
        this.emitOnChange();

        if (!this.loading) {
            this.ready = true;
        }
    }

    /**
     * Check if pagination is enabled.
     */
    protected get paginationEnabled(): boolean {
        return typeof this._options.pagination !== 'undefined' && this._options.pagination !== false;
    }

    protected getQuery() {
        return this.paginationEnabled ? this._pagination.query : super.getQuery();
    }

    private emitOnInitialized() {
        if (typeof this._options.onInitialized !== 'undefined') {
            this._options.onInitialized(this._id);
        }
    }

    private emitOnLimitChange(paginator, limit) {
        // TODO
    }

    private emitOnPageChange(paginator, page) {
        // TODO
    }

    private emitOnLoadingStart() {
        if (typeof this._options.onLoadingStart !== 'undefined') {
            this._options.onLoadingStart(this._id);
        }
    }

    private emitOnLoadingFinish() {
        if (typeof this._options.onLoadingFinish !== 'undefined') {
            this._options.onLoadingFinish(this._id);
        }
    }

    private emitOnChange() {
        if (typeof this._options.onChange !== 'undefined') {
            this._options.onChange(this._id, this.data);
        }
    }

    public subscribe(subscription, additionalVariables: any, options: SubscriptionOptions) {
        this._buoySubscription = this._buoy.subscribe(
            subscription,
            Object.assign(this.getVariables(), additionalVariables),
            options
        );

        return this;
    }

    /**
     * Reset the ready-state.
     */
    public resetReady(): this {
        this.ready = false;

        return this;
    }
}
