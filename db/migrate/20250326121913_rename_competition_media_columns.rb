# rubocop:disable all
# frozen_string_literal: true

class RenameCompetitionMediaColumns < ActiveRecord::Migration[7.2]
  def change
    change_table :CompetitionsMedia do |t|
      t.rename :type, :media_type
      t.rename :competitionId, :competition_id
      t.rename :submitterName, :submitter_name
      t.rename :submitterComment, :submitter_comment
      t.rename :submitterEmail, :submitter_email
      t.rename :timestampSubmitted, :submitted_at
      t.rename :timestampDecided, :decided_at
    end

    rename_table :CompetitionsMedia, :competition_media
  end
end
