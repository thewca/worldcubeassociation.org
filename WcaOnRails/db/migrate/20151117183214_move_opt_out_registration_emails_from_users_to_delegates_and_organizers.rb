# frozen_string_literal: true

class MoveOptOutRegistrationEmailsFromUsersToDelegatesAndOrganizers < ActiveRecord::Migration
  def change
    remove_column :users, :opt_out_registration_emails, :bool
    add_column :competition_delegates, :receive_registration_emails, :bool, default: true, null: false
    add_column :competition_organizers, :receive_registration_emails, :bool, default: true, null: false
  end
end
