import { Dict, MissingTranslationStrategy, Scope } from "./typing";
import { I18n } from "./I18n";
export declare const guessStrategy: MissingTranslationStrategy;
export declare const messageStrategy: MissingTranslationStrategy;
export declare const errorStrategy: MissingTranslationStrategy;
export declare class MissingTranslation {
    private i18n;
    private registry;
    constructor(i18n: I18n);
    register(name: string, strategy: MissingTranslationStrategy): void;
    get(scope: Scope, options: Dict): string;
}
