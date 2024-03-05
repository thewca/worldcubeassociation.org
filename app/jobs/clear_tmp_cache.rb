# frozen_string_literal: true

class ClearTmpCache < ApplicationJob
  def perform(args)
    # stolen from `railties` gem lib/rails/tasks/tmp.rake
    rm_rf Dir["tmp/cache/[^.]*"], verbose: false
  end
end
