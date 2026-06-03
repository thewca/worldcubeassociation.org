# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Persons list page" do
  scenario "renders the persons list React on Rails component", :js do
    visit "/persons"

    # Column header rendered by the PersonsList component once the persons
    # query resolves (renders even when no persons match).
    expect(page).to have_text(I18n.t("persons.index.podiums"))
  end
end