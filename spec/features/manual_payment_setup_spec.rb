# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Manual payment setup page", :js do
  let!(:competition) { create(:competition) }

  before do
    sign_in create(:admin)
  end

  scenario "renders the ManualPaymentSetup React on Rails component" do
    visit manual_payment_setup_path(competition)

    # This header is rendered by the ManualPaymentSetup component, so seeing it
    # proves the React on Rails component actually mounted.
    expect(page).to have_text(I18n.t("payments.payment_setup.manual_payments_header"))
  end
end
