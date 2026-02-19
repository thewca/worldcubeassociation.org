import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type NonPolymorphicProps<P, T extends ElementType> = Omit<
  ComponentPropsWithoutRef<T>,
  keyof P | "as"
>;

type PolymorphicInlineProps<P, T extends ElementType> = P & {
  as?: T;
} & NonPolymorphicProps<P, T>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PolymorphicComponent<P, D extends ElementType = "div", CP = any> = <
  E extends ElementType = ElementType<CP>,
  T extends E = D extends E ? D : E,
>(
  props: PolymorphicInlineProps<P, T>,
) => ReactNode;
