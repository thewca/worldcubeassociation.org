# frozen_string_literal: true

class CreateDelegatesTable < ActiveRecord::Migration[5.1]
  def change
    create_table :delegates do |t|
      t.integer :user_id, null: false
      t.string :status, null: false
      t.integer :senior_delegate_id
      t.string :region
      t.string :location_description
      t.string :phone_number
      t.string :notes

      t.timestamps null: false
    end

    reversible do |dir|
      dir.up do
        execute <<-SQL
          INSERT INTO delegates (user_id, status, senior_delegate_id, region, location_description, phone_number, notes, created_at, updated_at)
          SELECT id,delegate_status,senior_delegate_id, region, location_description, phone_number, notes, NOW(), NOW()
          from users
          where delegate_status is not null;
        SQL
      end
      dir.down do
        execute <<-SQL
          UPDATE users,delegates
          set delegate_status = delegates.status,
          users.senior_delegate_id = delegates.senior_delegate_id,
          users.region = delegates.region,
          users.location_description = delegates.location_description,
          users.phone_number = delegates.phone_number,
          users.notes = delegates.notes
          where users.id = delegates.user_id;
        SQL
      end
    end

    remove_column(:users, :delegate_status, :string)
    remove_column(:users, :senior_delegate_id, :integer)
    remove_column(:users, :region, :string)
    remove_column(:users, :location_description, :string)
    remove_column(:users, :phone_number, :string)
    remove_column(:users, :notes, :string)
  end
end
