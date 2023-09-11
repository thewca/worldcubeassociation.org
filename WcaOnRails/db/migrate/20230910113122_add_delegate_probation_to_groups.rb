# frozen_string_literal: true

class AddDelegateProbationToGroups < ActiveRecord::Migration[7.0]
  def change
    Group.create!(name: "Delegate Probation", group_type: "delegate_probation", is_active: true, is_hidden: true)
  end
end
