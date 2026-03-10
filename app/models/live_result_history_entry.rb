# frozen_string_literal: true

class LiveResultHistoryEntry < ApplicationRecord
  belongs_to :live_result
  belongs_to :entered_by, class_name: "User", optional: true

  enum :action_source, {
    api_sync: 'api_sync',
    live_results: 'live_results',
    backfilling: 'backfilling',
  }, prefix: true, default: :live_results

  enum :action_type, {
    proceeding: 'proceeding',
    scoretaking: 'scoretaking',
    bumped_up: 'bumped_up',
    locked: 'locked',
    quit: 'quit',
  }, prefix: true

  validates :entered_at, presence: true
  validates :entered_by, presence: true, unless: :action_source_backfilling?
  validates :action_type, presence: true, if: :action_source_live_results?
  validates :attempt_details, presence: true, if: :action_type_scoretaking?

  # Set a `entered_at` timestamp for newly created records,
  #   but only if there is no value already specified from the outside
  after_initialize :mark_entered_at, if: :new_record?, unless: :entered_at?

  private def mark_entered_at
    self.entered_at = current_time_from_proper_timezone
  end
end
