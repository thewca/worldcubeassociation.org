import BigNumber from "bignumber.js";
import { I18n } from "./I18n";
export type MakePlural = (count: number, ordinal?: boolean) => string;
export interface Dict {
    [key: string]: any;
}
export type DateTime = string | number | Date;
export interface TimeAgoInWordsOptions {
    includeSeconds?: boolean;
    scope?: Scope;
}
export type Numeric = BigNumber | string | number;
export type RoundingMode = "up" | "down" | "truncate" | "halfUp" | "default" | "halfDown" | "halfEven" | "banker" | "ceiling" | "ceil" | "floor";
export interface FormatNumberOptions {
    format: string;
    negativeFormat: string;
    precision: number | null;
    roundMode: RoundingMode;
    significant: boolean;
    separator: string;
    delimiter: string;
    stripInsignificantZeros: boolean;
    raise: boolean;
    unit: string;
}
export type NumberToHumanSizeOptions = Omit<FormatNumberOptions, "format" | "negativeFormat" | "raise">;
export type NumberToHumanUnits = {
    [key: string]: string;
};
export type NumberToHumanOptions = Omit<FormatNumberOptions, "negativeFormat" | "unit" | "raise"> & {
    units: NumberToHumanUnits | string;
};
export type NumberToDelimitedOptions = {
    delimiterPattern: RegExp;
    delimiter: string;
    separator: string;
};
export type NumberToPercentageOptions = Omit<FormatNumberOptions, "raise">;
export type NumberToRoundedOptions = Omit<FormatNumberOptions, "format" | "negativeFormat" | "raise"> & {
    precision: number;
};
export type NumberToCurrencyOptions = FormatNumberOptions;
export interface ToSentenceOptions {
    wordsConnector: string;
    twoWordsConnector: string;
    lastWordConnector: string;
}
export type PrimitiveType = number | string | null | undefined | boolean;
export type ArrayType = AnyObject[];
export type AnyObject = PrimitiveType | ArrayType | ObjectType;
export interface ObjectType {
    [key: string]: PrimitiveType | ArrayType | ObjectType;
}
export type MissingBehavior = "message" | "guess" | "error";
export interface I18nOptions {
    defaultLocale: string;
    availableLocales: string[];
    defaultSeparator: string;
    enableFallback: boolean;
    locale: string;
    missingBehavior: MissingBehavior;
    missingPlaceholder: MissingPlaceholderHandler;
    nullPlaceholder: NullPlaceholderHandler;
    missingTranslationPrefix: string;
    placeholder: RegExp;
    transformKey: (key: string) => string;
}
export type Scope = Readonly<string | string[]>;
export type LocaleResolver = (i18n: I18n, locale: string) => string[];
export type Pluralizer = (i18n: I18n, count: number) => string[];
export type MissingTranslationStrategy = (i18n: I18n, scope: Scope, options: Dict) => string;
export interface TranslateOptions {
    defaultValue?: any;
    count?: number;
    scope?: Scope;
    defaults?: Dict[];
    missingBehavior?: MissingBehavior | string;
    [key: string]: any;
}
export type MissingPlaceholderHandler = (i18n: I18n, placeholder: string, message: string, options: Dict) => string;
export type NullPlaceholderHandler = (i18n: I18n, placeholder: string, message: string, options: Dict) => string;
export type DayNames = [string, string, string, string, string, string, string];
export type MonthNames = [
    null,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string
];
export interface StrftimeOptions {
    meridian: {
        am: string;
        pm: string;
    };
    dayNames: DayNames;
    abbrDayNames: DayNames;
    monthNames: MonthNames;
    abbrMonthNames: MonthNames;
}
export type OnChangeHandler = (i18n: I18n) => void;
