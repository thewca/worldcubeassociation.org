# frozen_string_literal: true

class RenameCandidateToTrainee < ActiveRecord::Migration[7.1]
  def change
    RolesMetadataDelegateRegions.where(status: 'candidate_delegate').each do |metadata|
      metadata.update!(status: RolesMetadataDelegateRegions.statuses[:junior_delegate])
    end
  end
end
