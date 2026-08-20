# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Registration management", :js do
  let!(:delegate) { create(:delegate) }
  let(:competition) { create(:competition, :registration_open, delegates: [delegate]) }

  let!(:user1) { create(:user, name: "Johnny Bravo") }
  let!(:registration1) { create(:registration, user: user1, competition: competition) }

  context "when signed in as competition delegate" do
    before :each do
      sign_in delegate
    end

    scenario "smoke test" do
      visit competition_edit_registrations_path(competition)
      expect(page).to have_text("Johnny Bravo")
    end

    scenario "shows administrative notes when a registration has them" do
      registration1.update!(administrative_notes: "😎")

      visit competition_edit_registrations_path(competition)

      expect(page).to have_text(I18n.t('competitions.registration_v2.list.pending.title'))
      expect(page).to have_text(I18n.t('activerecord.attributes.registration.administrative_notes'))
      expect(page).to have_text("😎")
    end
  end
end
