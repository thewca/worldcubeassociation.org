# frozen_string_literal: true

class AddExternalRegistrationPageLinkToCompetitions < ActiveRecord::Migration[5.2]
  def change
    add_column :Competitions, :external_registration_page, :string, null: true, default: nil
    change_column_default(:Competitions, :use_wca_registration, from: false, to: true)
  end
end
