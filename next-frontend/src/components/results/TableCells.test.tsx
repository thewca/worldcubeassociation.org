import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Table } from "@chakra-ui/react";
import { Provider } from "@/components/ui/provider";
import { PositionCell } from "@/components/results/TableCells";
import { components } from "@/types/openapi";

// A competitor who placed 1st in one round of a Dual Round but 3rd across both of them, which is
// the only case where `pos` and `global_pos` disagree.
const result: Pick<
  components["schemas"]["V1RoundResult"],
  "pos" | "global_pos"
> = { pos: 1, global_pos: 3 };

function renderCell(props: Parameters<typeof PositionCell>[0]) {
  render(
    <Provider>
      <Table.Root>
        <Table.Body>
          <Table.Row>
            <PositionCell {...props} />
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </Provider>,
  );

  return screen.getByRole("cell");
}

describe("PositionCell", () => {
  it("shows the round position for a normal round", () => {
    expect(renderCell({ result, rankingMode: "round" })).toHaveTextContent(
      /^1$/,
    );
  });

  it("shows the round position for a head-to-head round", () => {
    expect(
      renderCell({ result, rankingMode: "head_to_head" }),
    ).toHaveTextContent(/^1$/);
  });

  it("shows both positions for a Dual Round", () => {
    expect(
      renderCell({ result, rankingMode: "linked_round" }),
    ).toHaveTextContent("1 (3)");
  });

  it("shows only the position across both rounds in the standings of a Dual Round", () => {
    expect(
      renderCell({ result, rankingMode: "linked_round", variant: "standings" }),
    ).toHaveTextContent(/^3$/);
  });

  it("shows the position of a normal round unchanged in standings", () => {
    // `global_pos` equals `pos` outside a Dual Round, so a podium reads the same either way.
    expect(
      renderCell({
        result: { pos: 2, global_pos: 2 },
        rankingMode: "round",
        variant: "standings",
      }),
    ).toHaveTextContent(/^2$/);
  });
});
