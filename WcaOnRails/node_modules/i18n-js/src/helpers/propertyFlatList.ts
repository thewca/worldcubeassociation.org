import isObject from "lodash/isObject";
import flattenDeep from "lodash/flattenDeep";

import { Dict } from "../typing";

interface Indexable {
  [key: string]: unknown;
}

class PropertyFlatList {
  public target: Dict;

  constructor(target: Dict) {
    this.target = target;
  }

  call(): string[] {
    const keys = flattenDeep(
      Object.keys(this.target).map((key) =>
        this.compute(this.target[key], key),
      ),
    );

    keys.sort();

    return keys as string[];
  }

  compute(value: unknown, path: string): unknown {
    if (!Array.isArray(value) && isObject(value)) {
      return Object.keys(value).map((key) =>
        this.compute((value as Indexable)[key] as unknown, `${path}.${key}`),
      );
    } else {
      return path;
    }
  }
}

/**
 * Generates a flat list with all properties from target object.
 *
 * @example
 * Given the following object:
 *
 * ```js
 * const target = {
 *   en: {
 *     messages: {
 *       hello: "Hi",
 *       bye: "Bye"
 *     }
 *   }
 * };
 * ```
 *
 * A flat property list would be:
 *
 * ```
 * const flatProps = [
 *   "en.messages.bye",
 *   "en.messages.hello"
 * ];
 * ```
 *
 * @private
 *
 * @param {Dict} target The object that will be mapped.
 *
 * @returns {string[]} The list of paths.
 */
export function propertyFlatList(target: Dict): string[] {
  return new PropertyFlatList(target).call();
}
