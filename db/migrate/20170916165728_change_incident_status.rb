# frozen_string_literal: true

class ChangeIncidentStatus < ActiveRecord::Migration[5.1]
  def change
    remove_column :incidents, :status, :integer
    add_column :incidents, :resolved_at, :datetime
    add_column :incidents, :digest_worthy, :boolean, default: false
    add_column :incidents, :digest_sent_at, :datetime
    rename_column :incidents, :name, :title
  end
end
