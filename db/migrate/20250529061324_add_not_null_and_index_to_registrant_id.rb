# frozen_string_literal: true

class AddNotNullAndIndexToRegistrantId < ActiveRecord::Migration[7.2]
  def change
    change_table :registrations, bulk: true do |t|
      t.change_null :registrant_id, false

      t.index %i[competition_id registrant_id], unique: true
    end
  end
end
