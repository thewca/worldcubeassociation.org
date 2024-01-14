import AbstractProvider, { EndpointArgument, ParseArgument, ProviderOptions, SearchResult } from './provider';
export declare type RequestResult = {
    results: RawResult[];
    query: RawQuery[];
};
export interface RawResult {
    country: string;
    country_code: string;
    state: string;
    county: string;
    city: string;
    postcode: number;
    suburb: string;
    street: string;
    lon: string;
    lat: string;
    state_code: string;
    formatted: string;
    bbox: BBox;
}
export interface RawQuery {
    text: string;
    parsed: RawQueryParsed;
}
export declare type RawQueryParsed = {
    city: string;
    expected_type: string;
};
export declare type BBox = {
    lon1: string;
    lat1: string;
    lon2: string;
    lat2: string;
};
export declare type GeoapifyProviderOptions = {
    searchUrl?: string;
    reverseUrl?: string;
} & ProviderOptions;
export default class GeoapifyProvider extends AbstractProvider<RequestResult, RawResult> {
    searchUrl: string;
    reverseUrl: string;
    constructor(options?: GeoapifyProviderOptions);
    endpoint({ query, type }: EndpointArgument): string;
    parse(response: ParseArgument<RequestResult>): SearchResult<RawResult>[];
}
