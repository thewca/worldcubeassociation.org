import OpenStreetMapProvider, { OpenStreetMapProviderOptions, RawResult, RequestResult } from './openStreetMapProvider';
interface RequestResultWithError extends RequestResult {
    error?: string;
}
import { ParseArgument, SearchResult } from './provider';
export default class LocationIQProvider extends OpenStreetMapProvider {
    constructor(options: OpenStreetMapProviderOptions);
    parse(response: ParseArgument<RequestResultWithError>): SearchResult<RawResult>[];
}
export {};
