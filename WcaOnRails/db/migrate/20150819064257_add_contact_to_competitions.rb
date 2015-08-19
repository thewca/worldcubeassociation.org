class AddContactToCompetitions < ActiveRecord::Migration
  def change
    add_column :Competitions, :contact, :string
  end
end
