# rubocop:disable all
# frozen_string_literal: true

class ExpandCancellationRestrictionsForCompetitions < ActiveRecord::Migration[7.2]
  def up
    add_column :Competitions, :competitor_can_cancel, :integer, default: 0, null: false
    Competition.where(allow_registration_self_delete_after_acceptance: false)
               .update_all(competitor_can_cancel: :not_accepted)
  end

  def down
    remove_column :Competitions, :competitor_can_cancel
  end
end
