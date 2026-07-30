# frozen_string_literal: true

require "rails_helper"

RSpec.feature "User avatar in navigation", :js do
  let!(:user) { create(:user) }

  before do
    sign_in user
  end

  scenario "renders the UserAvatar React on Rails component" do
    visit root_path

    # The UserAvatar component renders a div with a size-specific class ("tiny"
    # in the navigation), so finding it proves the React on Rails component
    # actually mounted from the shared components/ directory.
    expect(page).to have_css(".user-avatar-image-tiny", visible: :all)
  end
end
