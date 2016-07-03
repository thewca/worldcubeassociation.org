class AddSlugToCompetitions < ActiveRecord::Migration
  def up
    add_column :Competitions, :slug, :string, null: false, default: ""

    ActiveRecord::Base.connection.execute("UPDATE Competitions SET slug=id")
    change_column_default :Competitions, :slug, nil
    add_index :Competitions, :slug, unique: true
  end

  def down
    remove_column :Competitions, :slug
  end
end
