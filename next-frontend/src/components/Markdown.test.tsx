import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ChakraMarkdown } from "@/components/Markdown";

const renderMarkdown = (markdown: string) =>
  render(
    <ChakraProvider value={defaultSystem}>
      <ChakraMarkdown>{markdown}</ChakraMarkdown>
    </ChakraProvider>,
  );

describe("ChakraMarkdown", () => {
  it("renders a heading without a space after the hashes", () => {
    renderMarkdown("###Services");

    expect(
      screen.getByRole("heading", { level: 3, name: "Services" }),
    ).toBeTruthy();
  });

  it("ends the paragraph above and below a heading without a space", () => {
    renderMarkdown(
      "Intro text\n###What is it?\nThe association is non-profit.",
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "What is it?" }),
    ).toBeTruthy();
    expect(screen.getByText("Intro text").tagName).toBe("P");
    expect(screen.getByText("The association is non-profit.").tagName).toBe(
      "P",
    );
  });

  it("does not turn seven hashes into a heading", () => {
    renderMarkdown("#######Services");

    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("does not turn indented or escaped hashes into a heading", () => {
    renderMarkdown("> #quoted\n\n\\#escaped");

    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("keeps single line breaks", () => {
    const { container } = renderMarkdown("First line\nSecond line");

    expect(container.querySelector("p")?.innerHTML).toBe(
      "First line<br>\nSecond line",
    );
  });

  it("embeds a YouTube watch link", () => {
    const { container } = renderMarkdown(
      "Watch this: youtube(https://www.youtube.com/watch?v=abc123&t=10s)!",
    );

    expect(container.querySelector("iframe")?.getAttribute("src")).toBe(
      "https://www.youtube.com/embed/abc123",
    );
    expect(container.querySelector("iframe")?.hasAttribute("href")).toBe(false);
    expect(container.querySelector("p")?.textContent).toBe("Watch this: !");
  });

  it("embeds a YouTube watch link written as a markdown link", () => {
    const { container } = renderMarkdown(
      "youtube([our video](https://www.youtube.com/watch?v=abc123))",
    );

    expect(container.querySelector("iframe")?.getAttribute("src")).toBe(
      "https://www.youtube.com/embed/abc123",
    );
  });

  it("does not embed a link to another site", () => {
    const { container } = renderMarkdown(
      "youtube(https://notyoutube.com/watch?v=abc123)",
    );

    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("p")?.textContent).toBe(
      "youtube(https://notyoutube.com/watch?v=abc123)",
    );
  });
});
