# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Edit avatar page", :js do
  let!(:user) { create(:user_with_wca_id) }

  before do
    sign_in user
  end

  scenario "renders the EditAvatar React on Rails component" do
    visit "/profile/edit?section=avatar"

    # The guidelines header is rendered by the EditAvatar component, so seeing it
    # proves the React on Rails component actually mounted in the avatar tab.
    expect(page).to have_text(I18n.t("users.edit.guidelines"))
  end
end
