# frozen_string_literal: true
class RegulationsController < ApplicationController
  include HighVoltage::StaticPage

  before_action :ensure_trailing_slash

  private def page_finder_factory
    IndexPageFinder
  end

  private def ensure_trailing_slash
    desired_url = url_for(params.merge(trailing_slash: true))
    # url_for doesn't always add a trailing slash (it won't add a slash to
    # a url like example.com/index.html, for instance).
    # Only attempt to redirect if the current url does not match the one
    # url_for would want.
    if trailing_slash?(request.env['REQUEST_URI']) != trailing_slash?(desired_url)
      redirect_to desired_url, status: 301
    end
  end

  def trailing_slash?(url)
    url.match(/[^\?]+/).to_s.last == '/'
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
