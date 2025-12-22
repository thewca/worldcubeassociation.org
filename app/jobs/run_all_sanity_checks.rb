# frozen_string_literal: true

class RunAllSanityChecks < WcaCronjob
  def perform
    SanityCheckCategoryJob.perform_later(SanityCheckData::PersonDataIrregularities)
  end
end
