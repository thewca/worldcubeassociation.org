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
    ).toBeInTheDocument();
  });

  it("ends the paragraph above and below a heading without a space", () => {
    renderMarkdown(
      "Intro text\n###What is it?\nThe association is non-profit.",
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "What is it?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Intro text").tagName).toBe("P");
    expect(screen.getByText("The association is non-profit.").tagName).toBe(
      "P",
    );
  });

  it("does not turn seven hashes into a heading", () => {
    renderMarkdown("#######Services");

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("does not turn indented or escaped hashes into a heading", () => {
    renderMarkdown("> #quoted\n\n\\#escaped");

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
