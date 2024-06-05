# frozen_string_literal: true

class RegulationsController < ApplicationController
  before_action :ensure_trailing_slash

  REGULATIONS_VERSION_FILE = "version"

  # We need this so the relative links within the regulation HTML work
  private def trailing_slash?(url)
    url.match(/[^?]+/).to_s.last == '/'
  end

  private def ensure_trailing_slash
    desired_url = url_for(params.permit!.merge(trailing_slash: true))
    # url_for doesn't always add a trailing slash (it won't add a slash to
    # a url like example.com/index.html, for instance).
    # Only attempt to redirect if the current url does not match the one
    # url_for would want.
    if trailing_slash?(request.env['REQUEST_URI']) != trailing_slash?(desired_url)
      redirect_to desired_url, status: 301
    end
  end

  def render_regulations(route, version_file = REGULATIONS_VERSION_FILE)
    erb_file = RegulationsS3Helper.fetch_regulations_from_s3(route, version_file)
    render inline: erb_file, layout: "application"
  end

  def guidelines
    render_regulations("guidelines.html.erb")
  end

  def show
    render_regulations("index.html.erb")
  end

  def historical_guidelines
    render_regulations("history/official/#{params[:id]}/guidelines.html.erb")
  end

  def historical_regulations
    render_regulations("history/official/#{params[:id]}/index.html.erb")
  end
end
