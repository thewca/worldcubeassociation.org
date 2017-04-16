# frozen_string_literal: true

namespace :work do
  desc 'Schedule work to be done'
  task schedule: :environment do
    SubmitResultsNagJob.perform_later
    ComputeRelationsAuxiliaryData.perform_later
  end
end
