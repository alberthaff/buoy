import { QueryOptions } from '../query/query-options';
import { ActivatedRoute, Router } from '@angular/router';

export interface WatchQueryOptions extends QueryOptions {
    pagination?: false | string | any;    // TODO
    router?: {
        router: Router,
        route: ActivatedRoute;
    };
    fetch?: boolean;
    subscribe?: string;

    // Callbacks
    onInitialized?: (id: number) => void;
    onLimitChange?: (id: number, paginator: string, limit: number) => void;
    onPageChange?: (id: number, paginator: string, page: number) => void;
    onLoadingStart?: (id: number) => void;
    onLoadingFinish?: (id: number) => void;
    onChange?: (id: number, data: any) => void;
}
