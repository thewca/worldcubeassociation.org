# frozen_string_literal: true

class MoveOptOutRegistrationEmailsFromUsersToTraineeDelegates < ActiveRecord::Migration[5.2]
  def change
    add_column :competition_trainee_delegates, :receive_registration_emails, :bool, default: true, null: false
  end
end
