# frozen_string_literal: true

class RunAllSanityChecks < WcaCronjob
  def perform
    SanityCheck::PersonDataIrregularities.perform_later
  end
end
