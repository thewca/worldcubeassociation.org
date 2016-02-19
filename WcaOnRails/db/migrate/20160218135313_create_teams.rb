class CreateTeams < ActiveRecord::Migration
  def change
    create_table :teams do |t|
      t.string :friendly_id
      t.string :name, null: false
      t.text :description
      t.integer :leader_id

      t.timestamps null: false
    end
  end
end
