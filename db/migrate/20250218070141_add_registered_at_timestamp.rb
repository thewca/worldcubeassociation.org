# rubocop:disable all
# frozen_string_literal: true

class AddRegisteredAtTimestamp < ActiveRecord::Migration[7.2]
  def up
    add_column :registrations, :registered_at, :datetime, precision: 6
    Registration.update_all('registered_at = created_at')
    change_column_null :registrations, :registered_at, false

    ActiveRecord::Base.connection.execute(<<~SQL.squish)
      UPDATE registrations
      JOIN (
        SELECT registration_id, MIN(created_at) AS created_at
        FROM registration_history_entries
        WHERE action = 'Worker processed'
        GROUP BY registration_id
      ) AS subquery ON registrations.id = subquery.registration_id
      SET registrations.registered_at = subquery.created_at;
    SQL
  end

  def down
    remove_column :registrations, :registered_at
  end
end
