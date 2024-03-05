# frozen_string_literal: true

class RemoveTraineeDelegateAssociations < ActiveRecord::Migration[7.0]
  def change
    # This is tricky: We remove the associations in code so we have no Rails model to query via ORM.
    execute 'INSERT INTO competition_delegates (competition_id, delegate_id, receive_registration_emails, created_at, updated_at) ' \
            'SELECT competition_id, trainee_delegate_id, receive_registration_emails, created_at, updated_at FROM competition_trainee_delegates'

    # Drop the old table after storing all associations into the existing competition_delegates table.
    drop_table :competition_trainee_delegates
  end
end
