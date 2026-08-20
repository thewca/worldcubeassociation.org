export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;
