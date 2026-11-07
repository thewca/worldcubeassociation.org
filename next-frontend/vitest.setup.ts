import "@testing-library/jest-dom/vitest";

global.matchMedia =
  global.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    };
  };
