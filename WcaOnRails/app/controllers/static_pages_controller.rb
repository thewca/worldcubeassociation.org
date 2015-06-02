include ActionView::Helpers::AssetTagHelper
class StaticPagesController < ApplicationController
  def home
  end

  def about
  end

  def delegates
    @board_members = User.where(delegate_status: "board_member")
    @senior_delegates = User.where(delegate_status: "senior_delegate")
  end

  def organisations
  end

  def contact
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
