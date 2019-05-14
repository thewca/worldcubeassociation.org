# frozen_string_literal: true

class AddHiddenTeamForDelegatesOnProbation < ActiveRecord::Migration[5.1]
  def change
    Team.create(friendly_id: 'probation', hidden: true)
  end
end
