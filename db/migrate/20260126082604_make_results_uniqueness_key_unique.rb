# frozen_string_literal: true

class MakeResultsUniquenessKeyUnique < ActiveRecord::Migration[8.1]
  # rubocop:disable Rails/BulkChangeTable
  # We need to see the step-by-step output because this is a vital index
  def change
    # At the time of writing this migration, we already have an index on (round_id, person_id)
    #   but for historic reasons, it is not `UNIQUE`. We want to change that, but MySQL
    #   does not have syntax for "taking this existing index and making it unique".
    # So we drop the old index and immediately re-create it with the `UNIQUE` option set.
    remove_index :results, %i[round_id person_id], name: :results_person_uniqueness_speedup
    add_index :results, %i[round_id person_id], unique: true, name: :results_person_uniqueness_speedup
  end
  # rubocop:enable Rails/BulkChangeTable
end
