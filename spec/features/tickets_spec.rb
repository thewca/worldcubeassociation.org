# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Ticket page", :js do
  let!(:ticket) { create(:competition_result_ticket) }

  before do
    # A user who is not a stakeholder of the ticket, so the component renders
    # its no-access branch rather than needing stakeholder-specific fixtures.
    sign_in create(:user)
  end

  scenario "renders the Tickets React on Rails component" do
    visit ticket_path(ticket.ticket)

    # This message is rendered by the Tickets component after it fetches the
    # ticket, so seeing it proves the React on Rails component actually mounted.
    expect(page).to have_text("No Ticket Access")
  end
end
