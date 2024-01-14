"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intersectionMockInstance = exports.mockIsIntersecting = exports.mockAllIsIntersecting = exports.resetIntersectionMocking = exports.setupIntersectionMocking = void 0;
const test_utils_1 = require("react-dom/test-utils");
let isMocking = false;
const observers = new Map();
// If we are running in a valid testing environment, we can mock the IntersectionObserver.
if (typeof beforeEach !== 'undefined' && typeof afterEach !== 'undefined') {
    beforeEach(() => {
        // Use the exposed mock function. Currently, only supports Jest (`jest.fn`) and Vitest with globals (`vi.fn`).
        if (typeof jest !== 'undefined')
            setupIntersectionMocking(jest.fn);
        else if (typeof vi !== 'undefined') {
            // Cast the `vi.fn` to `jest.fn` - The returned `Mock` type has a different signature than `jest.fn`
            setupIntersectionMocking(vi.fn);
        }
    });
    afterEach(() => {
        resetIntersectionMocking();
    });
}
function warnOnMissingSetup() {
    if (isMocking)
        return;
    console.error(`React Intersection Observer was not configured to handle mocking.
Outside Jest and Vitest, you might need to manually configure it by calling setupIntersectionMocking() and resetIntersectionMocking() in your test setup file.

// test-setup.js
import { resetIntersectionMocking, setupIntersectionMocking } from 'react-intersection-observer/test-utils';

beforeEach(() => {
  setupIntersectionMocking(vi.fn);
});

afterEach(() => {
  resetIntersectionMocking();
});`);
}
/**
 * Create a custom IntersectionObserver mock, allowing us to intercept the `observe` and `unobserve` calls.
 * We keep track of the elements being observed, so when `mockAllIsIntersecting` is triggered it will
 * know which elements to trigger the event on.
 * @param mockFn The mock function to use. Defaults to `jest.fn`.
 */
function setupIntersectionMocking(mockFn) {
    global.IntersectionObserver = mockFn((cb, options = {}) => {
        var _a, _b, _c;
        const item = {
            callback: cb,
            elements: new Set(),
            created: Date.now(),
        };
        const instance = {
            thresholds: Array.isArray(options.threshold)
                ? options.threshold
                : [(_a = options.threshold) !== null && _a !== void 0 ? _a : 0],
            root: (_b = options.root) !== null && _b !== void 0 ? _b : null,
            rootMargin: (_c = options.rootMargin) !== null && _c !== void 0 ? _c : '',
            observe: mockFn((element) => {
                item.elements.add(element);
            }),
            unobserve: mockFn((element) => {
                item.elements.delete(element);
            }),
            disconnect: mockFn(() => {
                observers.delete(instance);
            }),
            takeRecords: mockFn(),
        };
        observers.set(instance, item);
        return instance;
    });
    isMocking = true;
}
exports.setupIntersectionMocking = setupIntersectionMocking;
/**
 * Reset the IntersectionObserver mock to its initial state, and clear all the elements being observed.
 */
function resetIntersectionMocking() {
    // @ts-ignore
    if (global.IntersectionObserver)
        global.IntersectionObserver.mockClear();
    observers.clear();
}
exports.resetIntersectionMocking = resetIntersectionMocking;
function triggerIntersection(elements, trigger, observer, item) {
    const entries = [];
    const isIntersecting = typeof trigger === 'number'
        ? observer.thresholds.some((threshold) => trigger >= threshold)
        : trigger;
    let ratio;
    if (typeof trigger === 'number') {
        const intersectedThresholds = observer.thresholds.filter((threshold) => trigger >= threshold);
        ratio =
            intersectedThresholds.length > 0
                ? intersectedThresholds[intersectedThresholds.length - 1]
                : 0;
    }
    else {
        ratio = trigger ? 1 : 0;
    }
    elements.forEach((element) => {
        var _a;
        entries.push({
            boundingClientRect: element.getBoundingClientRect(),
            intersectionRatio: ratio,
            intersectionRect: isIntersecting
                ? element.getBoundingClientRect()
                : {
                    bottom: 0,
                    height: 0,
                    left: 0,
                    right: 0,
                    top: 0,
                    width: 0,
                    x: 0,
                    y: 0,
                    toJSON() { },
                },
            isIntersecting,
            rootBounds: observer.root instanceof Element
                ? (_a = observer.root) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect()
                : null,
            target: element,
            time: Date.now() - item.created,
        });
    });
    // Trigger the IntersectionObserver callback with all the entries
    if (test_utils_1.act)
        (0, test_utils_1.act)(() => item.callback(entries, observer));
    else
        item.callback(entries, observer);
}
/**
 * Set the `isIntersecting` on all current IntersectionObserver instances
 * @param isIntersecting {boolean | number}
 */
function mockAllIsIntersecting(isIntersecting) {
    warnOnMissingSetup();
    for (let [observer, item] of observers) {
        triggerIntersection(Array.from(item.elements), isIntersecting, observer, item);
    }
}
exports.mockAllIsIntersecting = mockAllIsIntersecting;
/**
 * Set the `isIntersecting` for the IntersectionObserver of a specific element.
 *
 * @param element {Element}
 * @param isIntersecting {boolean | number}
 */
function mockIsIntersecting(element, isIntersecting) {
    warnOnMissingSetup();
    const observer = intersectionMockInstance(element);
    if (!observer) {
        throw new Error('No IntersectionObserver instance found for element. Is it still mounted in the DOM?');
    }
    const item = observers.get(observer);
    if (item) {
        triggerIntersection([element], isIntersecting, observer, item);
    }
}
exports.mockIsIntersecting = mockIsIntersecting;
/**
 * Call the `intersectionMockInstance` method with an element, to get the (mocked)
 * `IntersectionObserver` instance. You can use this to spy on the `observe` and
 * `unobserve` methods.
 * @param element {Element}
 * @return IntersectionObserver
 */
function intersectionMockInstance(element) {
    warnOnMissingSetup();
    for (let [observer, item] of observers) {
        if (item.elements.has(element)) {
            return observer;
        }
    }
    throw new Error('Failed to find IntersectionObserver for element. Is it being observed?');
}
exports.intersectionMockInstance = intersectionMockInstance;
