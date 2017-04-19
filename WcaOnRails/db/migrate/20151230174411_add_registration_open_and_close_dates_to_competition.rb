# frozen_string_literal: true

class AddRegistrationOpenAndCloseDatesToCompetition < ActiveRecord::Migration
  def change
    reversible do |dir|
      dir.up do
        add_column :Competitions, :registration_open, :datetime
        add_column :Competitions, :registration_close, :datetime
        add_column :Competitions, :use_wca_registration, :boolean, null: false, default: false
        execute <<-SQL
          UPDATE Competitions
            SET use_wca_registration=1
            WHERE showPreregForm=1 OR showPreregList=1;
        SQL
        execute <<-SQL
          UPDATE Competitions
            SET
              registration_open=IF(NOW() < CONCAT(year,'-',LPAD(endMonth,2,'00'),'-',LPAD(endDay,2,'00')), NOW(), CONCAT(year,'-',LPAD(endMonth,2,'00'),'-',LPAD(endDay,2,'00'))) - INTERVAL 1 DAY,
              registration_close=CONCAT(year,'-',LPAD(endMonth,2,'00'),'-',LPAD(endDay,2,'00'))
            WHERE use_wca_registration=1;
        SQL
        remove_column :Competitions, :showPreregForm
        remove_column :Competitions, :showPreregList
      end

      dir.down do
        add_column :Competitions, :showPreregForm, :boolean, null: false, default: false
        add_column :Competitions, :showPreregList, :boolean, null: false, default: false
        execute <<-SQL
          UPDATE Competitions
            SET showPreregList=1
            WHERE use_wca_registration=1;
        SQL
        execute <<-SQL
          UPDATE Competitions
            SET showPreregForm=1
            WHERE registration_open < NOW() AND NOW() < registration_close;
        SQL
        remove_column :Competitions, :registration_open
        remove_column :Competitions, :registration_close
        remove_column :Competitions, :use_wca_registration
      end
    end
  end
end
