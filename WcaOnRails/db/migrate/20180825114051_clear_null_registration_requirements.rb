# frozen_string_literal: true

class ClearNullRegistrationRequirements < ActiveRecord::Migration[5.2]
  def change
    Competition.visible.where(extra_registration_requirements: "#").update_all(extra_registration_requirements: nil)
  end
end
