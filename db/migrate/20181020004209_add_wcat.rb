# frozen_string_literal: true

class AddWcat < ActiveRecord::Migration[5.2]
  def change
    execute <<-SQL.squish
      INSERT INTO teams (friendly_id, email, rank, created_at, updated_at) values ('wcat', 'competitions@worldcubeassociation.org', 110, NOW(), NOW());
    SQL
  end
end
