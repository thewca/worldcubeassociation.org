# frozen_string_literal: true

class AddForeignKeyToResultAttemptsOnResultId < ActiveRecord::Migration[8.1]
  def change
    up_only do
      execute "DELETE FROM result_attempts WHERE result_id NOT IN (SELECT id FROM results)"
      execute "UPDATE result_attempts SET updated_at = created_at WHERE updated_at IS NULL"
    end

    add_foreign_key :result_attempts, :results, on_delete: :cascade
  end
end
