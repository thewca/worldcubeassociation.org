# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Officers and board page" do
  scenario "renders officers fetched from the API", :js do
    # `:js` specs use the truncation DB strategy, so these committed rows are
    # visible to the Capybara server thread. We need at least one board role
    # because the component dereferences `board[0]` and would otherwise crash
    # (and render nothing) when no board members exist.
    chair = create(:chair_role)
    board_member = create(:board_role)

    visit "/officers-and-board"

    # Description paragraph rendered by the OfficersAndBoard component once the
    # officer/board roles load from the API.
    expect(page).to have_text(I18n.t("page.officers_and_board.officers_description"))
    # The fetched officer and board members are rendered into user badges.
    expect(page).to have_text(chair.user.name)
    expect(page).to have_text(board_member.user.name)
  end
end
