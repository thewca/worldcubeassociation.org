# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Stripe PaymentElement integration" do
  before :each do
    # Enable CSRF protection just for these tests.
    # See https://blog.tomoyukikashiro.me/post/test-csrf-in-feature-test-using-capybara/
    allow_any_instance_of(ActionController::Base).to receive(:protect_against_forgery?).and_return(true)
  end

  # Note to avid readers: Stripe suppresses automated frontend integration tests.
  # > Frontend interfaces, like Stripe Checkout or the Payment Element, have security measures in place that prevent automated testing.
  #   (as per https://stripe.com/docs/automated-testing)
  # We simply test that we can boot the interface, and we test that the PIs are processed in requests/registrations_spec.rb
  context "on the 'register' page of a visible competition" do
    let(:competition) { FactoryBot.create(:competition, :stripe_connected, :accepts_donations, :visible, :registration_open, events: Event.where(id: %w(222 333))) }
    let!(:user) { FactoryBot.create(:user, :wca_id) }
    let!(:registration) { FactoryBot.create(:registration, competition: competition, user: user) }

    background do
      sign_in user
      visit competition_register_path(competition)
      expect(page).to have_selector("#payment-element iframe")
    end

    it "loads the PaymentElement", js: true, retry: 3 do
      # In the beginning, the button to pay should be disabled
      expect(page).to have_button('Pay now!', disabled: true)

      within_frame(page.find('#payment-element iframe')) do
        fill_in with: "4242424242424242", name: "number"
        fill_in with: "12#{(Time.now.year + 1) % 100}", name: "expiry"
        fill_in with: "427", name: "cvc"
        select 'United States', from: "country"
        fill_in with: "12345", name: "postalCode"
      end

      # Now that we filled in (somewhat) reasonable information,
      # the button to pay should be enabled for the user to proceed.
      # Note that we can't test the logic behind the button as per the longer comment above.
      expect(page).to have_button('Pay now!', disabled: false)
    end

    it "changes subtotal when using a donation", js: true, retry: 3 do
      subtotal_label = page.find('#money-subtotal')

      format_money = format_money(registration.outstanding_entry_fees)
      expect(subtotal_label).to have_text(format_money)

      # donate some arbitrary amount less than the actual entry fee
      donation_money = competition.base_entry_fee / 2

      check 'toggle-show-donation'
      fill_in with: donation_money.amount.to_s, id: 'donation_input_field'

      # Trigger a blur event to incentivize JS to trigger the change event on the input field.
      find("body").click

      format_money = format_money(registration.outstanding_entry_fees + donation_money)
      expect(subtotal_label).to have_text(format_money)
    end

    it "warns when the subtotal is too high", js: true, retry: 3 do
      # (accidentally?) donate a ridiculously high amount of money
      donation_money = competition.base_entry_fee * competition.base_entry_fee.cents

      check 'toggle-show-donation'
      fill_in with: donation_money.amount.to_s, id: 'donation_input_field'

      within_frame(page.find('#payment-element iframe')) do
        fill_in with: "4242424242424242", name: "number"
        fill_in with: "12#{(Time.now.year + 1) % 100}", name: "expiry"
        fill_in with: "427", name: "cvc"
        select 'United States', from: "country"
        fill_in with: "12345", name: "postalCode"
      end

      # This dismiss_confirm is crucial because it means we expect a confirm modal to pop up!
      dismiss_confirm do
        click_on 'Pay now!'
      end

      format_money = format_money(registration.outstanding_entry_fees + donation_money)
      expect(page.find('#money-subtotal')).to have_text(format_money)
    end
  end
end
