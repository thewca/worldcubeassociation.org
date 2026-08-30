# frozen_string_literal: true

class StaticPagesController < ApplicationController
  include DocumentsHelper

  def home
  end

  # Permalink to the current version of a motion, so that links elsewhere do not
  # have to be updated every time a motion is amended.
  def motion
    @motion_id = params.expect(:id)
    section, subsection = @motion_id.split('.')
    url = latest_motion_url(section, subsection)

    return render 'motion_not_found', status: :not_found if url.nil?

    redirect_to url, allow_other_host: true
  end

  def score_tools
  end

  def logo
  end

  def api_help
  end

  def robots
    respond_to :txt
  end
end
