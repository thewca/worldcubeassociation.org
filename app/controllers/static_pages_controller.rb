# frozen_string_literal: true

class StaticPagesController < ApplicationController
  include DocumentsHelper

  def home
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
