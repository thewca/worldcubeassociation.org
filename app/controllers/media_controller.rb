# frozen_string_literal: true

class MediaController < ApplicationController
  before_action :authenticate_user!, except: [:index]
  before_action -> { redirect_to_root_unless_user(:can_approve_media?) }, except: %i[index new create]

  def index
    params[:status] = "accepted"
    params[:year] ||= Date.today.year
    @media = all_media
    render :index
  end

  def new
    @medium = CompetitionMedium.new
  end

  def edit
    @medium = find_medium
    I18n.with_locale(:en) { render :edit }
  end

  def create
    params = medium_params.merge(
      "status" => "pending",
      "submitter_name" => current_user.name,
      "submitter_email" => current_user.email,
    )
    @medium = CompetitionMedium.new(params)

    if @medium.save
      flash[:success] = "Thanks for sending us new media!"
      redirect_to new_medium_path
    else
      render :new
    end
  end

  private def all_media
    params[:year] ||= "all years"
    params[:region] ||= "all"

    media = CompetitionMedium.includes(:competition).where(status: params[:status]).order(submitted_at: :desc)
    media = media.joins(:competition).where("YEAR(competitions.start_date) = :media_start", media_start: params[:year]) unless params[:year] == "all years"
    media = media.belongs_to_region(params[:region]) unless params[:region] == "all"

    media
  end

  def validate
    params[:status] ||= "pending"
    @media = all_media
    I18n.with_locale(:en) { render :validate }
  end

  def update
    @medium = find_medium
    if @medium.update(medium_params)
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
      redirect_to validate_media_path
    else
      I18n.with_locale(:en) { render :edit }
    end
  end

  private def medium_params
    params.require(:competition_medium).permit(
      :competition_id,
      :media_type,
      :text,
      :uri,
      :submitter_name,
      :submitter_email,
      :submitter_comment,
      :status,
    )
  end

  private def find_medium
    CompetitionMedium.find(params[:id])
  end
end
