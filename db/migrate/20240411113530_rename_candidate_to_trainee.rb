# frozen_string_literal: true

class RenameCandidateToTrainee < ActiveRecord::Migration[7.1]
  def change
    RolesMetadataDelegateRegions.where(status: 'candidate_delegate').update_all(status: RolesMetadataDelegateRegions.statuses[:junior_delegate])
  end
end
