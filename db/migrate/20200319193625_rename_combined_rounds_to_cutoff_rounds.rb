# frozen_string_literal: true

class RenameCombinedRoundsToCutoffRounds < ActiveRecord::Migration[5.2]
  def change
    # This change goes along renaming Combined Rounds to Cutoff Rounds in the seeds file to comply with 2020 WCA Regulations.
    RoundType.delete_all
    load Rails.root.join("db/seeds/round_types.seeds.rb").to_s
  end
end
