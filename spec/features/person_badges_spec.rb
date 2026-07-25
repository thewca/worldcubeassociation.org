# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Person page badges", :js do
  let!(:delegate) { create(:delegate) }
  # The person page reads the first result to pick the event tab, so the person
  # needs at least one result for the page to render at all.
  let!(:result) { create(:result, person: delegate.person) }

  scenario "renders the PersonsBadges React on Rails component" do
    visit person_path(delegate.wca_id)

    # The badge for the delegate's active role is rendered by the Badges
    # component, so seeing it proves the React on Rails component mounted.
    expect(page).to have_text(I18n.t("enums.user_roles.status.delegate_regions.delegate"))
  end
end
