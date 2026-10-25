# frozen_string_literal: true

class ApplicationJob < ActiveJob::Base
  RESULTS_QUEUE_NAME = :results

  queue_as :default
end
