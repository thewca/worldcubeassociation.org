# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Trainee Delegate application", :js do
  scenario "renders the application form React component" do
    sign_in create(:user_with_wca_id, dob: Date.new(2000, 1, 1))

    visit trainee_delegate_application_path

    expect(page).to have_text("Which Delegate region do you currently live in?")
  end
end
