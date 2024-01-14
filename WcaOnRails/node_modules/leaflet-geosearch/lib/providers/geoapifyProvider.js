import AbstractProvider, { RequestType, } from './provider';
export default class GeoapifyProvider extends AbstractProvider {
    constructor(options = {}) {
        super(options);
        const host = 'https://api.geoapify.com/v1/geocode';
        this.searchUrl = options.searchUrl || `${host}/search`;
        this.reverseUrl = options.reverseUrl || `${host}/reverse`;
    }
    endpoint({ query, type }) {
        const params = typeof query === 'string' ? { text: query } : query;
        params.format = 'json';
        switch (type) {
            case RequestType.REVERSE:
                return this.getUrl(this.reverseUrl, params);
            default:
                return this.getUrl(this.searchUrl, params);
        }
    }
    parse(response) {
        const records = Array.isArray(response.data.results)
            ? response.data.results
            : [response.data.results];
        return records.map((r) => ({
            x: Number(r.lon),
            y: Number(r.lat),
            label: r.formatted,
            bounds: [
                [parseFloat(r.bbox.lat1), parseFloat(r.bbox.lon1)],
                [parseFloat(r.bbox.lat2), parseFloat(r.bbox.lon2)], // n, e
            ],
            raw: r,
        }));
    }
}
//# sourceMappingURL=geoapifyProvider.js.map