# frozen_string_literal: true

module SingletonApplicationJob
  extend ActiveSupport::Concern

  included do
    before_enqueue do |job|
      # Abort if job of the kind is already enqueued.
      throw :abort if job.class.in_progress?
    end
  end
end
