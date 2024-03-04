# frozen_string_literal: true

class RegistrationEmailDefaultChange < ActiveRecord::Migration[6.1]
  def change
    change_column_default :competition_delegates, :receive_registration_emails, from: 1, to: 0
    change_column_default :competition_organizers, :receive_registration_emails, from: 1, to: 0
    change_column_default :competition_trainee_delegates, :receive_registration_emails, from: 1, to: 0
  end
end
