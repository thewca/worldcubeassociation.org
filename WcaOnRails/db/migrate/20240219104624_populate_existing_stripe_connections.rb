# frozen_string_literal: true

class PopulateExistingStripeConnections < ActiveRecord::Migration[7.1]
  def up
    # Each competition with a connected_stripe_account_id should have a payment integration created for it
    Competition.where.not(connected_stripe_account_id: nil).find_each do |comp|
      account = ConnectedStripeAccount.create(account_id: comp.connected_stripe_account_id)
      comp.competition_payment_integrations.new(connected_account: account)
      comp.save
    end
  end

  def down
    # Remove all created records - including the ConnectedStripeAccount, as we are rolling back, not just disconnecting
    Competition.where.not(connected_stripe_account_id: nil).find_each do |comp|
      competition.competition_payment_integrations.find_each do |integration|
        integration.connected_account.destroy
      end
      competition.competition_payment_integrations.destroy_all
    end
  end
end
