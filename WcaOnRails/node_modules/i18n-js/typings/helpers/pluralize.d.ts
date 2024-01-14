import { Scope, TranslateOptions } from "../typing";
import { I18n } from "../I18n";
export declare function pluralize({ i18n, count, scope, options, baseScope, }: {
    i18n: I18n;
    count: number;
    scope: Scope;
    options: TranslateOptions;
    baseScope: string;
}): string;
