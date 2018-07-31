# frozen_string_literal: true

class RemoveNordicChampionshipType < ActiveRecord::Migration[5.2]
  def change
    EligibleCountryIso2ForChampionship.where(championship_type: "nordic").destroy_all
  end
end
