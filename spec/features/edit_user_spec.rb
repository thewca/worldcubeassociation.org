# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Edit user" do
  let!(:admin) { FactoryBot.create(:admin) }
  let(:existing_user) { FactoryBot.create(:user_with_wca_id) }
  let(:new_person) { FactoryBot.create(:person) }
  let(:new_user) do
    FactoryBot.create(:user, name: new_person.name, country_iso2: new_person.country_iso2,
                             dob: new_person.dob, gender: new_person.gender)
  end

  def navigate_to_form(user)
    visit edit_user_path(user)
  end

  def submit_form
    find('input[type="submit"]').click
  end

  scenario "entering wca id", js: true do
    sign_in admin
    navigate_to_form(new_user)

    # Entering an existing wca id
    fill_in "WCA ID", with: existing_user.wca_id
    submit_form

    expect(page).to have_text "WCA ID is already used by #{existing_user.name}"

    # Entering a valid wca id
    fill_in "WCA ID", with: new_person.wca_id
    submit_form

    expect(page).to have_text "Account updated"
  end
end
