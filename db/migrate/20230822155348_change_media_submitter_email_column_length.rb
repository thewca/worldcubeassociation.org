# frozen_string_literal: true

class ChangeMediaSubmitterEmailColumnLength < ActiveRecord::Migration[7.0]
  def change
    change_column :CompetitionsMedia, :submitterName, :string, limit: nil
    change_column :CompetitionsMedia, :submitterEmail, :string, limit: nil
  end
end
