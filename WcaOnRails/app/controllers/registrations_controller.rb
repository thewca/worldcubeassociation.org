class RegistrationsController < ApplicationController
  before_action :authenticate_user!, except: [:new, :create]

  before_action :can_manage_competition_only, only: [:index, :update_all, :update]
  private def can_manage_competition_only
    competition = Competition.find(params[:competition_id])
    unless current_user && current_user.can_manage_competition?(competition)
      flash[:danger] = "You are not allowed to manage this competition"
      redirect_to root_url
    end
  end

  before_action :registration_matches_competition, only: [:update]
  private def registration_matches_competition
    competition = Competition.find(params[:competition_id])
    registration = Registration.find(params[:id])
    unless competition == registration.competition
      flash[:danger] = "Given registration does not match competition"
      redirect_to root_url
    end
  end

  def index
    @competition_registration_view = true
    @competition = Competition.find(params[:competition_id])
    respond_to do |format|
      format.html
      format.csv do
        headers['Content-Disposition'] = "attachment; filename=\"#{@competition.id}-registration.csv\""
        headers['Content-Type'] ||= 'text/csv; charset=UTF-8'
      end
    end
  end

  def update_all
    @competition_registration_view = true
    @competition = Competition.find(params[:competition_id])
    ids = []
    registration_ids = params.select { |k| k.start_with?("registration-") }.map { |k, v| k.split('-')[1] }
    registrations = registration_ids.map do |registration_id|
      @competition.registrations.find_by_id!(registration_id)
    end
    case params[:registrations_action]
    when "accept-selected"
      registrations.each { |registration| registration.update_attribute(:status, "a") }
      flash[:success] = "#{"Registration".pluralize(registrations.length)} approved!"
    when "reject-selected"
      registrations.each { |registration| registration.update_attribute(:status, "p") }
      flash[:warning] = "#{"Registration".pluralize(registrations.length)} moved to waiting list"
    when "delete-selected"
      registrations.each { |registration| registration.delete }
      flash[:warning] = "#{"Registration".pluralize(registrations.length)} deleted"
    else
      throw "Unrecognized action #{params[:registrations_action]}"
    end
    redirect_to competition_registrations_path(@competition)
  end

  def update
    @registration = Registration.find(params[:id])
    if @registration.update_attributes(registration_params)
      respond_with_bip(@registration)
    else
      respond_with_bip(@registration)
    end
  end

  def register
    competition = Competition.find(params[:competition_id])
    @registration = nil
    if current_user
      @registration = competition.registrations.where(user_id: current_user.id).first
    end
    if !@registration
      @registration = competition.registrations.build(user_id: current_user.id)
    end
  end

  def create
    competition = Competition.find(params[:competition_id])
    @registration = competition.registrations.build(registration_params.merge(user_id: current_user.id))
    if @registration.save
      flash[:success] = "Successfully registered!"
      redirect_to competition_register_path
    else
      render :register
    end
  end

  private def registration_params
    params.require(:registration).permit(
      :personId,
      :email,
      :name,
      :countryId,
      :birthday,
      :guests,
      :comments,
      :eventIds,
    )
  end
end
