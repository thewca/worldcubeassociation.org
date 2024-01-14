/**
 * Create a custom IntersectionObserver mock, allowing us to intercept the `observe` and `unobserve` calls.
 * We keep track of the elements being observed, so when `mockAllIsIntersecting` is triggered it will
 * know which elements to trigger the event on.
 * @param mockFn The mock function to use. Defaults to `jest.fn`.
 */
export declare function setupIntersectionMocking(mockFn: typeof jest.fn): void;
/**
 * Reset the IntersectionObserver mock to its initial state, and clear all the elements being observed.
 */
export declare function resetIntersectionMocking(): void;
/**
 * Set the `isIntersecting` on all current IntersectionObserver instances
 * @param isIntersecting {boolean | number}
 */
export declare function mockAllIsIntersecting(isIntersecting: boolean | number): void;
/**
 * Set the `isIntersecting` for the IntersectionObserver of a specific element.
 *
 * @param element {Element}
 * @param isIntersecting {boolean | number}
 */
export declare function mockIsIntersecting(element: Element, isIntersecting: boolean | number): void;
/**
 * Call the `intersectionMockInstance` method with an element, to get the (mocked)
 * `IntersectionObserver` instance. You can use this to spy on the `observe` and
 * `unobserve` methods.
 * @param element {Element}
 * @return IntersectionObserver
 */
export declare function intersectionMockInstance(element: Element): IntersectionObserver;
