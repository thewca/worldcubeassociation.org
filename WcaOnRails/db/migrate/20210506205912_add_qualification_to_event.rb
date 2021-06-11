# frozen_string_literal: true

class AddQualificationToEvent < ActiveRecord::Migration[5.2]
  def change
    add_column :competition_events, :qualification, :text, null: true, default: nil
  end
end
