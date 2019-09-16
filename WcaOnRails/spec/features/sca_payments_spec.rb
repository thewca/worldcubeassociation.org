# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Strong Customer Authentification payment" do
  before :each do
    # Enable CSRF protection just for these tests.
    # See https://blog.tomoyukikashiro.me/post/test-csrf-in-feature-test-using-capybara/
    allow_any_instance_of(ActionController::Base).to receive(:protect_against_forgery?).and_return(true)
  end

  context "on the 'register' page of a visible competition" do
    let(:competition) { FactoryBot.create(:competition, :stripe_connected, :visible, :registration_open, events: Event.where(id: %w(222 333))) }
    let!(:user) { FactoryBot.create(:user, :wca_id) }
    let!(:registration) { FactoryBot.create(:registration, competition: competition, user: user) }
    let!(:card) { FactoryBot.create(:credit_card, :sca_card) }

    background do
      sign_in user
      visit competition_register_path(competition)
    end

    scenario "user pays with a 3D secure enabled card", js: true do
      fill_confirm_and_expect(card, "test-source-authorize-3ds", "Your payment was successful")
    end

    it "user fails to complete the 3D secure challenge", js: true do
      fill_confirm_and_expect(card, "test-source-fail-3ds", "We are unable to authenticate your payment method")
    end
  end
end

def fill_confirm_and_expect(card, button_id, message)
  fill_in with: "John Doe", id: "cardholder-name"
  within_frame(page.first("#card-element iframe")) do
    fill_in with: card[:number], name: "cardnumber"
    fill_in with: "#{card[:exp_month]}#{card[:exp_year]}", name: "exp-date"
    fill_in with: card[:cvc], name: "cvc"
    fill_in with: "12345", name: "postal"
  end
  click_on "Pay your fees with card"
  Capybara.using_wait_time(15) do
    # The 3D secure challenge is in a modal in an iframe in an iframe
    within_frame(page.find(:xpath, "/html/body/div[1]/iframe")) do
      within_frame(page.find("#challengeFrame")) do
        # I tested, without success, `page.find("#test-source-authorize-3ds").click`
        page.evaluate_script("document.getElementById('#{button_id}').click()")
      end
    end
    expect(page).to have_text(message)
  end
end
