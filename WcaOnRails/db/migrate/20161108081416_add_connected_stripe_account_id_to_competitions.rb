# frozen_string_literal: true

class AddConnectedStripeAccountIdToCompetitions < ActiveRecord::Migration
  def change
    add_column :Competitions, :connected_stripe_account_id, :string
  end
end
