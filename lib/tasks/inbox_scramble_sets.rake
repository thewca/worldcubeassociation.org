# frozen_string_literal: true

namespace :inbox_scramble_sets do
  desc "Backport round_number for already matched rounds"
  task backfill_round_number: :environment do
    InboxScrambleSet.includes(:matched_round)
                    .where(round_number: 0)
                    .where.not(matched_round: nil)
                    .find_each do |ibs|
                      ibs.update!(round_number: ibs.matched_round.number)
    end
  end
end
