class AddNewcomerAllowedToCompetition < ActiveRecord::Migration[7.1]
  def change
    add_column :Competitions, :newcomers_allowed, :boolean, default: true
    Competition.update_all(newcomers_allowed: true)
  end
end
