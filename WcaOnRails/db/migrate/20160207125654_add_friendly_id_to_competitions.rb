class AddFriendlyIdToCompetitions < ActiveRecord::Migration
  def up
    add_column :Competitions, :friendly_id, :string, null: false, default: ""

    ActiveRecord::Base.connection.execute("UPDATE Competitions SET friendly_id=id")
    change_column_default :Competitions, :friendly_id, nil
    add_index :Competitions, :friendly_id, unique: true
  end

  def down
    remove_column :Competitions, :friendly_id
  end
end
