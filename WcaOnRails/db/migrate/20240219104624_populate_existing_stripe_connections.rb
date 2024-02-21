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
    # Write all Stripe account id's back to Competiiton.connected_stripe_account_id column
    CompetitionPaymentIntegration.all.find_each do |integration|
      next unless integration.connected_account_type == 'ConnectedStripeAccount'
      competition = integration.competition
      competition.connected_stripe_account_id = integration.connected_account.account_id
      competition.save
    end
    CompetitionPaymentIntegration.destroy_all
    ConnectedStripeAccount.destroy_all
  end
end
