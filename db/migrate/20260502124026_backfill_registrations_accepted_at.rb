# frozen_string_literal: true

class BackfillRegistrationsAcceptedAt < ActiveRecord::Migration[8.1]
  def up
    latest_change_ids = RegistrationHistoryChange.joins(:registration_history_entry)
                                                 .where(key: 'competing_status', value: 'accepted')
                                                 .group('registration_history_entries.registration_id')
                                                 .select('MAX(registration_history_changes.id)')

    RegistrationHistoryChange.includes(registration_history_entry: :registration)
                             .where(id: latest_change_ids)
                             .find_each do |change|
      registration = change.registration_history_entry.registration
      next if registration&.accepted_at.present?

      registration&.update_columns(accepted_at: change.registration_history_entry.created_at)
    end
  end

  def down
  end
end
