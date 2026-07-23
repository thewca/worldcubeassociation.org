# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Registrations import page", :js do
  let!(:competition) { create(:competition) }

  before do
    sign_in create(:admin)
  end

  scenario "renders the ImportRegistrations React on Rails component" do
    visit registrations_import_path(competition)

    # This info message is rendered directly by the ImportRegistrations component,
    # so seeing it proves the React on Rails component actually mounted.
    expect(page).to have_text(I18n.t("registrations.import.info"))
  end
end
