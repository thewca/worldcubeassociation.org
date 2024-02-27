# frozen_string_literal: true

class UpdateTrinidadAndTobago < ActiveRecord::Migration[5.1]
  def up
    Country.find("Trinidad and Tobago").update(continentId: "_North America")
  end
end
