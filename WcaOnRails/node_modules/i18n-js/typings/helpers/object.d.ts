import { AnyObject } from "../../index.d";
export declare type KeyModifier = (key: string) => string;
export declare function dump(object: AnyObject): AnyObject;
export declare function load(object: AnyObject): AnyObject;
