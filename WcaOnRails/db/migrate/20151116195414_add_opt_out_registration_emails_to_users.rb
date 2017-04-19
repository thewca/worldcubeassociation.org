# frozen_string_literal: true

class AddOptOutRegistrationEmailsToUsers < ActiveRecord::Migration
  def change
    add_column :users, :opt_out_registration_emails, :bool
  end
end
