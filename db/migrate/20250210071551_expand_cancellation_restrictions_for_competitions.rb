# frozen_string_literal: true

class ExpandCancellationRestrictionsForCompetitions < ActiveRecord::Migration[7.2]
  def up
    add_column :Competitions, :cancellation_restrictions, :integer, default: 0, null: false
    Competition.where(allow_registration_self_delete_after_acceptance: false)
                .update_all(cancellation_restrictions: 1)
  end

  def down
    remove_column :Competitions, :cancellation_restrictions
  end
end
