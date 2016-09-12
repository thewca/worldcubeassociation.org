# frozen_string_literal: true
class RegistrationsController < ApplicationController
  before_action :authenticate_user!, except: [:new, :create, :index, :psych_sheet, :psych_sheet_event, :register]

  private def competition_from_params
    if params[:competition_id]
      competition = Competition.find(params[:competition_id])
    else
      registration = Registration.find(params[:id])
      competition = registration.competition
    end
    if !competition.user_can_view?(current_user)
      raise ActionController::RoutingError.new('Not Found')
    end
    competition
  end

  before_action :competition_must_be_using_wca_registration!
  private def competition_must_be_using_wca_registration!
    if !competition_from_params.use_wca_registration?
      flash[:danger] = "This competition is not using WCA registration"
      redirect_to competition_path(competition_from_params)
    end
  end

  before_action -> { redirect_unless_user(:can_manage_competition?, competition_from_params) }, only: [:edit_registrations, :do_actions_for_selected, :edit]

  def edit_registrations
    @competition = competition_from_params
  end

  def psych_sheet
    @competition = competition_from_params
    most_main_event = @competition.events.min_by { |e| e.rank }
    redirect_to competition_psych_sheet_event_url(@competition.id, most_main_event.id)
  end

  def psych_sheet_event
    @competition = competition_from_params
    @event = Event.find(params[:event_id])
    @preferred_format = @event.preferred_formats.first
    @registrations = @competition.psych_sheet_event(@event)
  end

  def index
    @competition = competition_from_params
    @registrations = @competition.registrations.accepted.includes(:user, :registration_events)
  end

  def edit
    @registration = Registration.find(params[:id])
    @competition = @registration.competition
  end

  def destroy
    @competition = competition_from_params
    @registration = Registration.find(params[:id])
    if params.key?(:user_is_deleting_theirself)
      if !current_user.can_edit_registration?(@registration)
        flash[:danger] = "You cannot delete your registration."
      else
        @registration.destroy!
        mailer = RegistrationsMailer.notify_organizers_of_deleted_registration(@registration)
        mailer.deliver_now
        flash[:success] = I18n.t('competitions.registration.flash.deleted', comp: @competition.name)
      end
      redirect_to competition_register_path(@competition)
    elsif current_user.can_manage_competition?(@competition)
      @registration.destroy!
      mailer = RegistrationsMailer.notify_registrant_of_deleted_registration(@registration)
      mailer.deliver_now
      flash[:success] = "Deleted registration and emailed #{mailer.to.join(" ")}"
      redirect_to competition_edit_registrations_path(@registration.competition)
    end
  end

  private def selected_registrations_from_params
    params[:selected_registrations].map { |r| r.split('-')[1] }.map do |registration_id|
      competition_from_params.registrations.find_by_id!(registration_id)
    end
  end

  def export
    @competition = competition_from_params
    @registrations = selected_registrations_from_params

    respond_to do |format|
      format.csv do
        headers['Content-Disposition'] = "attachment; filename=\"#{@competition.id}-registration.csv\""
        headers['Content-Type'] ||= 'text/csv; charset=UTF-8'
      end
    end
  end

  def do_actions_for_selected
    @competition = competition_from_params
    registrations = selected_registrations_from_params

    case params[:registrations_action]
    when "accept-selected"
      registrations.each do |registration|
        if !registration.accepted?
          registration.update!(accepted_at: Time.now)
          RegistrationsMailer.notify_registrant_of_accepted_registration(registration).deliver_now
        end
      end
      flash.now[:success] = "#{"Registration".pluralize(registrations.length)} accepted! Email #{"notification".pluralize(registrations.length)} sent."
    when "reject-selected"
      registrations.each do |registration|
        if !registration.pending?
          registration.update!(accepted_at: nil)
          RegistrationsMailer.notify_registrant_of_pending_registration(registration).deliver_now
        end
      end
      flash.now[:warning] = "#{"Registration".pluralize(registrations.length)} moved to waiting list"
    when "delete-selected"
      registrations.each do |registration|
        registration.destroy
        RegistrationsMailer.notify_registrant_of_deleted_registration(registration).deliver_now
      end
      flash.now[:warning] = "#{"Registration".pluralize(registrations.length)} deleted"
    when "export-selected"
    else
      raise "Unrecognized action #{params[:registrations_action]}"
    end

    respond_to do |format|
      if params[:registrations_action] == "export-selected"
        format.js { render :redirect_to_export }
      else
        format.js { render :do_actions_for_selected }
      end
    end
  end

  def update
    @registration = Registration.find(params[:id])
    @competition = @registration.competition
    if params[:from_admin_view] && @registration.updated_at.to_datetime != params[:registration][:updated_at].to_datetime
      flash.now[:danger] = "Did not update registration because competitor updated registration since the page was loaded."
      render :edit
      return
    end
    was_accepted = @registration.accepted?
    if current_user.can_edit_registration?(@registration) && @registration.update_attributes(registration_params)
      if !was_accepted && @registration.accepted?
        mailer = RegistrationsMailer.notify_registrant_of_accepted_registration(@registration)
        mailer.deliver_now
        flash[:success] = "Accepted registration and emailed #{mailer.to.join(" ")}"
      elsif was_accepted && !@registration.accepted?
        mailer = RegistrationsMailer.notify_registrant_of_pending_registration(@registration)
        mailer.deliver_now
        flash[:success] = "Accepted registration and emailed #{mailer.to.join(" ")}"
      else
        flash[:success] = I18n.t('competitions.registration.flash.updated')
      end
      if params[:from_admin_view]
        redirect_to edit_registration_path(@registration)
      else
        redirect_to competition_register_path(@registration.competition)
      end
    else
      flash.now[:danger] = I18n.t('competitions.registration.flash.failed')
      render :edit
    end
  end

  def register_require_sign_in
    @competition = competition_from_params
    redirect_to competition_register_path(@competition)
  end

  def register
    @competition = competition_from_params
    @registration = nil
    if current_user
      registrations = @competition.registrations
      @registration = registrations.find_by_user_id(current_user.id) || registrations.build(user_id: current_user.id)
    end
  end

  def create
    @competition = competition_from_params
    if !@competition.registration_opened?
      flash[:danger] = "You cannot register for this competition, registration is closed"
      redirect_to competition_path(@competition)
      return
    end
    @registration = @competition.registrations.build(registration_params.merge(user_id: current_user.id))
    if @registration.save
      flash[:success] = I18n.t('competitions.registration.flash.registered')
      RegistrationsMailer.notify_organizers_of_new_registration(@registration).deliver_now
      RegistrationsMailer.notify_registrant_of_new_registration(@registration).deliver_now
      redirect_to competition_register_path
    else
      render :register
    end
  end

  private def registration_params
    permitted_params = [
      :personId,
      :email,
      :name,
      :countryId,
      :birthday,
      :guests,
      :comments,
      registration_events_attributes: [:id, :event_id, :_destroy],
    ]
    if current_user.can_manage_competition?(competition_from_params)
      permitted_params << :accepted_at
      status = params[:registration][:status]
      if status
        params[:registration][:accepted_at] = (status == "a" ? Time.now : nil)
      end
    end
    params.require(:registration).permit(*permitted_params)
  end
end
