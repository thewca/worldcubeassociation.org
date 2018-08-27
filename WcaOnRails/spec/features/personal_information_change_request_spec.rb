# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Request personal information change" do
  let!(:user) { FactoryBot.create(:user, :wca_id) }

  context "when signed in" do
    before(:each) { sign_in user }

    scenario "entering wca id", js: true do
      navigate_to_form

      # The form should already have our WCA ID selected, so we can just wait
      # for the user data to load.
      expect(page).to have_selector("#fix_personal_information_contact_name:not([disabled])")

      fill_in "Correct birthdate", with: "1782-05-12"
      attach_file "Document", Rails.root.join("spec/support/logo.jpg")

      contact_argument = nil
      expect_any_instance_of(FixPersonalInformationContact).to receive(:deliver) do |contact|
        contact_argument = contact
      end

      submit_form

      expect(contact_argument.your_email).to eq user.email
      expect(contact_argument.wca_id).to eq user.wca_id
      expect(contact_argument.dob).to eq "1782-05-12"
      expect(contact_argument.gender).to eq user.gender
      expect(page).to have_text "Thank you for your message. We will contact you soon!"
    end
  end

  context "when not signed in", js: true do
    scenario "can submit request" do
      navigate_to_form

      # Fill in WCA ID and wait for the user data to load.
      fill_in_selectize "Your WCA ID", with: user.wca_id
      expect(page).to have_selector("#fix_personal_information_contact_name:not([disabled])")

      fill_in "Your email", with: "foo@example.com"
      fill_in "Correct birthdate", with: "1660-05-12"
      attach_file "Document", Rails.root.join("spec/support/logo.jpg")

      contact_argument = nil
      expect_any_instance_of(FixPersonalInformationContact).to receive(:deliver) do |contact|
        contact_argument = contact
      end

      submit_form

      expect(contact_argument.your_email).to eq "foo@example.com"
      expect(contact_argument.wca_id).to eq user.wca_id
      expect(contact_argument.dob).to eq "1660-05-12"
      expect(contact_argument.gender).to eq user.gender
      expect(page).to have_text "Thank you for your message. We will contact you soon!"
    end
  end

  def navigate_to_form
    visit contact_fix_personal_information_path
  end

  def submit_form
    find('input[type="submit"]').click
  end
end
