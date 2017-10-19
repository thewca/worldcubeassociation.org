# frozen_string_literal: true

class MediaController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_approve_media?) }

  def validate
    @status = params["status"]
    @status = "pending" unless CompetitionMedium.statuses.include?(@status)
    @media = CompetitionMedium.includes(:competition).where(status: @status).order(timestampSubmitted: :desc)

    I18n.with_locale(:en) { render :validate }
  end

  def edit
    @medium = find_medium
    I18n.with_locale(:en) { render :edit }
  end

  def update
    @medium = find_medium
    if @medium.update_attributes(medium_params)
      flash[:success] = "Updated medium"
      redirect_to edit_medium_path(@medium)
    else
      I18n.with_locale(:en) { render :edit }
    end
  end

  def destroy
    @medium = find_medium
    if @medium.destroy
      flash[:success] = "Deleted medium"
      redirect_to media_validate_path
    else
      I18n.with_locale(:en) { render :edit }
    end
  end

  private def medium_params
    params.require(:competition_medium).permit(
      :competitionId,
      :type,
      :text,
      :uri,
      :submitterName,
      :submitterEmail,
      :submitterComment,
      :status,
    )
  end

  private def find_medium
    CompetitionMedium.find(params[:id])
  end
end
