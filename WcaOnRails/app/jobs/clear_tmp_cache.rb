# frozen_string_literal: true

class ClearTmpCache < ApplicationJob
  queue_as :default

  def perform(args)
    # stolen from `railties` gem lib/rails/tasks/tmp.rake
    rm_rf Dir["tmp/cache/[^.]*"], verbose: false
  end
end
