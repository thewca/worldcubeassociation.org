# frozen_string_literal: true

class RegulationsController < ApplicationController
  include HighVoltage::StaticPage

  private def page_finder_factory
    IndexPageFinder
  end
end

class IndexPageFinder < HighVoltage::PageFinder
  def find
    path = super
    is_dir = Dir.exist? "app/views/#{path}"
    if is_dir
      path = File.join(path, "index")
    end
    path
  end
end
