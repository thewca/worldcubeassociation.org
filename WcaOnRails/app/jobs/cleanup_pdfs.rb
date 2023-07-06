# frozen_string_literal: true

class CleanupPdfs < ApplicationJob
  CACHE_DIRECTORY = Rails.root.join("tmp/cache/pdfs").freeze
  RM_DELAY = 1.week

  def perform
    Dir["*.pdf", base: CACHE_DIRECTORY].each do |f|
      file = CACHE_DIRECTORY.join(f)
      File.delete(file) if File.mtime(file) < RM_DELAY.ago
    end
  end
end
