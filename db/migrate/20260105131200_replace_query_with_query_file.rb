# frozen_string_literal: true

class ReplaceQueryWithQueryFile < ActiveRecord::Migration[8.1]
  def change
    change_table :sanity_checks, bulk: true do |t|
      t.remove :query, type: :text
      t.string :query_file
    end
  end
end
