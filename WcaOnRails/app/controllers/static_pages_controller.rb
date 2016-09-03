# frozen_string_literal: true
include ActionView::Helpers::AssetTagHelper
class StaticPagesController < ApplicationController
  def home
  end

  def about
    @committees = Committee.all
  end

  def delegates
    redirect_to committee_path(Committee::WCA_DELEGATES_COMMITTEE)
  end

  def organisations
  end

  def contact
    @committees = Committee.all
  end

  def score_tools
  end

  def logo
  end

  def wca_workbook_assistant
  end

  def wca_workbook_assistant_versions
  end

  def robots
    respond_to :txt
  end
end
