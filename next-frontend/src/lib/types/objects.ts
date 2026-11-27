export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

type ForbidKeys<Keys extends PropertyKey> = { [Key in Keys]?: never };

/**
 * Creates a new type that exposes keys from both shapes while requiring one complete shape.
 *
 * Useful for reading fields from either shape without narrowing first.
 * A missing field reads as `undefined`.
 *
 * @example
 * type Contact = MergeExclusive<{ email: string }, { phone: string }>;
 * function getContactDetail(contact: Contact) {
 *   return contact.email ?? contact.phone;
 * }
 */
export type MergeExclusive<Left extends object, Right extends object> =
  | (Left & ForbidKeys<Exclude<keyof Right, keyof Left>>)
  | (Right & ForbidKeys<Exclude<keyof Left, keyof Right>>);
