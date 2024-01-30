# frozen_string_literal: true

class RegulationsController < ApplicationController
  REGULATIONS_VERSION_FILE = "version"

  def render_regulations(route)
    erb_file = RegulationsS3Helper.fetch_regulations_from_s3(route, REGULATIONS_VERSION_FILE)
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
