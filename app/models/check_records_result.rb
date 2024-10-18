# frozen_string_literal: true

class CheckRecordsResult < ApplicationRecord
  def finished?
    run_end.present?
  end

  def started?
    run_start.present?
  end
end
