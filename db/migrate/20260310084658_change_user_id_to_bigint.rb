# frozen_string_literal: true

class ChangeUserIdToBigint < ActiveRecord::Migration[8.1]
  def change
    remove_foreign_key :h2h_match_competitors, :users
    remove_foreign_key :live_results, :users, column: :locked_by_id
    remove_foreign_key :live_results, :users, column: :quit_by_id
    remove_foreign_key :payment_intents, :users, column: :initiated_by_id
    remove_foreign_key :potential_duplicate_persons, :users, column: :original_user_id
    remove_foreign_key :scramble_file_uploads, :users, column: :uploaded_by
    remove_foreign_key :ticket_comments, :users, column: :acting_user_id
    remove_foreign_key :ticket_logs, :users, column: :acting_user_id
    remove_foreign_key :user_avatars, :users
    remove_foreign_key :user_roles, :users

    reversible do |dir|
      dir.up do
        change_column :users, :id, :bigint

        change_column :h2h_match_competitors, :user_id, :bigint
        change_column :live_results, :locked_by_id, :bigint
        change_column :live_results, :quit_by_id, :bigint
        change_column :payment_intents, :initiated_by_id, :bigint
        change_column :potential_duplicate_persons, :original_user_id, :bigint
        change_column :scramble_file_uploads, :uploaded_by, :bigint
        change_column :ticket_comments, :acting_user_id, :bigint
        change_column :ticket_logs, :acting_user_id, :bigint
        change_column :user_avatars, :user_id, :bigint
        change_column :user_roles, :user_id, :bigint
      end

      dir.down do
        change_column :users, :id, :integer

        change_column :h2h_match_competitors, :user_id, :integer
        change_column :live_results, :locked_by_id, :integer
        change_column :live_results, :quit_by_id, :integer
        change_column :payment_intents, :initiated_by_id, :integer
        change_column :potential_duplicate_persons, :original_user_id, :integer
        change_column :scramble_file_uploads, :uploaded_by, :integer
        change_column :ticket_comments, :acting_user_id, :integer
        change_column :ticket_logs, :acting_user_id, :integer
        change_column :user_avatars, :user_id, :integer
        change_column :user_roles, :user_id, :integer
      end
    end

    add_foreign_key :h2h_match_competitors, :users
    add_foreign_key :live_results, :users, column: :locked_by_id
    add_foreign_key :live_results, :users, column: :quit_by_id
    add_foreign_key :payment_intents, :users, column: :initiated_by_id
    add_foreign_key :potential_duplicate_persons, :users, column: :original_user_id
    add_foreign_key :scramble_file_uploads, :users, column: :uploaded_by
    add_foreign_key :ticket_comments, :users, column: :acting_user_id
    add_foreign_key :ticket_logs, :users, column: :acting_user_id
    add_foreign_key :user_avatars, :users
    add_foreign_key :user_roles, :users
  end
end
