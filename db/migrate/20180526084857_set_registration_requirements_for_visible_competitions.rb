# frozen_string_literal: true

class SetRegistrationRequirementsForVisibleCompetitions < ActiveRecord::Migration[5.1]
  def up
    Competition.visible.where(registration_requirements: nil).update_all(registration_requirements: "#")
  end
end
