# frozen_string_literal: true

require "rails_helper"

def give_donation_checkbox
  # WARNING: Do not use Capybara "unckeck" on this, because it technically (in the HTML sense) isn't even a checkbox.
  all(:css, "label[for='useDonationCheckbox']").last
end

RSpec.feature "Stripe PaymentElement integration", :js do
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
    let(:competition) { create(:competition, :stripe_connected, :accepts_donations, :visible, :registration_open, events: Event.where(id: %w[222 333])) }
    let!(:user) { create(:user, :wca_id) }
    let!(:registration) { create(:registration, competition: competition, user: user) }

    background do
      sign_in user
      visit competition_register_path(competition)
      expect(page).to have_css("#payment-element iframe")
    end

    it "loads the PaymentElement" do
      pending('Stripe frontend tests intermediate failure. Signed GB 22/Jul/2024')

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

    it "changes subtotal when using a donation" do
      subtotal_label = page.find_by_id('money-subtotal')

      format_money = format_money(registration.outstanding_entry_fees)
      expect(subtotal_label).to have_text(format_money)

      # donate some arbitrary amount less than the actual entry fee
      donation_money = competition.base_entry_fee / 2

      give_donation_checkbox.click
      fill_in_autonumeric '#donationInputField', with: donation_money.amount.to_s

      format_money = format_money(registration.outstanding_entry_fees + donation_money)
      expect(subtotal_label).to have_text(format_money)
    end

    it "warns when the subtotal is too high" do
      pending('Stripe frontend tests intermediate failure. Signed GB 22/Jul/2024')

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
      expect(page.find_by_id('money-subtotal')).to have_text(format_money)
    end
  end
end
