class AddRegistrationOpenAndCloseDatesToCompetition < ActiveRecord::Migration
  def change
    add_column :Competitions, :registration_open, :datetime, null: false
    add_column :Competitions, :registration_close, :datetime, null: false
    add_column :Competitions, :use_wca_registration, :boolean, null: false, default: false

    reversible do |dir|
      dir.up do
        execute <<-SQL
          UPDATE Competitions
            SET use_wca_registration=1
            WHERE showPreregForm=1 OR showPreregList=1;
        SQL

      end

      dir.down do
        raise ActiveRecord::IrreversibleMigration
      end
    end

    remove_column :Competitions, :showPreregForm, :boolean
    remove_column :Competitions, :showPreregList, :boolean
  end
end
