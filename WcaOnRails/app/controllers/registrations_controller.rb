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

  before_action -> { redirect_unless_user(:can_manage_competition?, competition_from_params) }, only: [:edit_registrations, :update_all, :update]

  def edit_registrations
    @competition_registration_view = true
    @competition = competition_from_params
    respond_to do |format|
      format.html
      format.csv do
        headers['Content-Disposition'] = "attachment; filename=\"#{@competition.id}-registration.csv\""
        headers['Content-Type'] ||= 'text/csv; charset=UTF-8'
      end
    end
  end

  def psych_sheet
    @competition = competition_from_params
    most_main_event = @competition.events.min_by { |e| e.rank }
    redirect_to competition_psych_sheet_event_url(@competition.id, most_main_event.id)
  end

  def psych_sheet_event
    @competition = competition_from_params
    @event = Event.find(params[:event_id])

    # TODO - pull registered events out into a join table
    # https://github.com/cubing/worldcubeassociation.org/issues/275#issuecomment-167347053
    @registrations = @competition.registrations.accepted.all.select { |r|
      r.events.include?(@event)
    }.sort_by { |r|
      has_competed = !!r.world_rank(@event, @event.sort_by)
      [ has_competed ? 0 : 1, r.world_rank(@event, @event.sort_by) || Float::INFINITY, r.world_rank(@event, @event.sort_by_second) || Float::INFINITY, r.name ]
    }

    position = 0
    @registrations.each_with_index do |registration, i|
      prev_registration = i > 0 ? @registrations[i - 1] : nil
      registration.tied_previous = false
      if prev_registration
        registration.tied_previous = registration.world_rank(@event, @event.sort_by) == prev_registration.world_rank(@event, @event.sort_by)
      end
      if !registration.tied_previous
        position += 1
      end
      has_competed = !!registration.world_rank(@event, @event.sort_by)
      registration.position = has_competed ? position : nil
    end
  end

  def index
    @competition = competition_from_params
    @registrations = @competition.registrations.accepted.sort_by &:name
  end

  def edit
    @registration = Registration.find(params[:id])
    @competition = @registration.competition
  end

  def destroy
    @competition = competition_from_params
    @registration = Registration.find(params[:id])
    if params.has_key?(:user_is_deleting_theirself)
      if @registration.user_id == current_user.id
        @registration.destroy!
        mailer = RegistrationsMailer.notify_organizers_of_deleted_registration(@registration)
        mailer.deliver_now
        flash[:success] = "Successfully deleted your registration for #{@competition.name}"
      elsif 
        flash[:danger] = "You cannot delete other people's Registrations."
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

  def update_all
    @competition_registration_view = true
    @competition = competition_from_params
    ids = []
    registration_ids = params.select { |k| k.start_with?("registration-") }.map { |k, v| k.split('-')[1] }
    registrations = registration_ids.map do |registration_id|
      @competition.registrations.find_by_id!(registration_id)
    end
    case params[:registrations_action]
    when "accept-selected"
      registrations.each do |registration|
        if !registration.accepted?
          registration.accepted!
          RegistrationsMailer.notify_registrant_of_accepted_registration(registration).deliver_now
        end
      end
      flash[:success] = "#{"Registration".pluralize(registrations.length)} accepted! Email #{"notification".pluralize(registrations.length)} sent."
    when "reject-selected"
      registrations.each do |registration|
        if !registration.pending?
          registration.pending!
          RegistrationsMailer.notify_registrant_of_pending_registration(registration).deliver_now
        end
      end
      flash[:warning] = "#{"Registration".pluralize(registrations.length)} moved to waiting list"
    when "delete-selected"
      registrations.each do |registration|
        registration.destroy
        RegistrationsMailer.notify_registrant_of_deleted_registration(registration).deliver_now
      end
      flash[:warning] = "#{"Registration".pluralize(registrations.length)} deleted"
    else
      raise "Unrecognized action #{params[:registrations_action]}"
    end
    redirect_to competition_edit_registrations_path(@competition)
  end

  def update
    @registration = Registration.find(params[:id])
    was_accepted = @registration.accepted?
    if @registration.update_attributes(registration_params)
      if !was_accepted && @registration.accepted?
        mailer = RegistrationsMailer.notify_registrant_of_accepted_registration(@registration)
        mailer.deliver_now
        flash[:success] = "Accepted registration and emailed #{mailer.to.join(" ")}"
      elsif was_accepted && !@registration.accepted?
        mailer = RegistrationsMailer.notify_registrant_of_pending_registration(@registration)
        mailer.deliver_now
        flash[:success] = "Accepted registration and emailed #{mailer.to.join(" ")}"
      else
        flash[:success] = "Updated registration"
      end
      redirect_to edit_registration_path(@registration)
    else
      flash.now[:danger] = "Could not update registration"
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
      flash[:success] = "Successfully registered!"
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
      event_ids: Event.all.map(&:id),
    ]
    if current_user.can_manage_competition?(competition_from_params)
      permitted_params << :status
    end
    registration_params = params.require(:registration).permit(*permitted_params)

    if registration_params.has_key?(:event_ids)
      registration_params[:eventIds] = registration_params[:event_ids].select { |k, v| v == "1" }.keys.join " "
      registration_params.delete(:event_ids)
    end
    registration_params
  end
end
