import { render, screen } from "@testing-library/react";
import { act } from "react";
import { Provider as UiProvider } from "@/components/ui/provider";
import Footer from "@/components/Footer";

describe("Footer", () => {
  it("renders without crashing", async () => {
    await act(async () => {
      render(
        <UiProvider>
          <Footer />
        </UiProvider>,
      );
    });

    expect(screen.getByText("About Us")).toBeInTheDocument();
  });
});
