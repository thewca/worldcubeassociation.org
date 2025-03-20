# frozen_string_literal: true

class Api::V1::Registrations::RegistrationsController < Api::V1::ApiController
  skip_before_action :validate_jwt_token, only: [:list]
  # The order of the validations is important to not leak any non public info via the API
  # That's why we should always validate a request first, before taking any other before action
  # before_actions are triggered in the order they are defined
  before_action :validate_create_request, only: [:create]
  before_action :validate_show_registration, only: [:show]
  before_action :validate_list_admin, only: [:list_admin]
  before_action :ensure_registration_exists, only: [:update]
  before_action :user_can_modify_registration, only: [:update]
  before_action :validate_update_request, only: [:update]
  before_action :user_can_bulk_modify_registrations, only: [:bulk_update]
  before_action :validate_bulk_update_request, only: [:bulk_update]
  before_action :validate_payment_ticket_request, only: [:payment_ticket]

  rescue_from ActiveRecord::RecordNotFound do
    render json: {}, status: :not_found
  end

  rescue_from WcaExceptions::RegistrationError do |e|
    # TODO: Figure out what the best way to log errors in development is
    Rails.logger.debug { "Create was rejected with error #{e.error} at #{e.backtrace[0]}" }
    render_error(e.status, e.error, e.data)
  end

  rescue_from WcaExceptions::BulkUpdateError do |e|
    Rails.logger.debug { "Bulk update was rejected with error #{e.errors} at #{e.backtrace[0]}" }
    render_error(e.status, e.errors)
  end

  def validate_show_registration
    @user_id, @competition_id = show_params
    @competition = Competition.find(@competition_id)
    render_error(:unauthorized, Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless @current_user.id == @user_id.to_i || @current_user.can_manage_competition?(@competition)
  end

  def show
    registration = Registration.find_by!(user_id: @user_id, competition_id: @competition_id)
    render json: registration.to_v2_json(admin: true, history: true)
  end

  def create
    # Currently we only have one lane
    if params[:competing]
      competing_params = params.permit(:guests, competing: [:status, :comment, { event_ids: [] }, :admin_comment])

      user_id = registration_params['user_id']
      competition_id = registration_params['competition_id']

      AddRegistrationJob.prepare_task(user_id, competition_id)
                        .perform_later("competing", competition_id, user_id, competing_params)
      return render json: { status: 'accepted', message: 'Started Registration Process' }, status: :accepted
    end

    render json: { status: 'bad request', message: 'You need to supply at least one lane' }, status: :bad_request
  end

  def validate_create_request
    Registrations::RegistrationChecker.create_registration_allowed!(params, @current_user)
  end

  def update
    if params[:competing]
      updated_registration = Registrations::Lanes::Competing.update!(params, @competition, @current_user.id)
      return render json: { status: 'ok', registration: updated_registration.to_v2_json(admin: true, history: true) }, status: :ok
    end
    render json: { status: 'bad request', message: 'You need to supply at least one lane' }, status: :bad_request
  end

  def ensure_registration_exists
    @competition = Competition.find(params.require('competition_id'))
    @registration = Registration.includes(:user).find_by(competition: @competition, user_id: params.require('user_id'))
    raise WcaExceptions::RegistrationError.new(:not_found, Registrations::ErrorCodes::REGISTRATION_NOT_FOUND) if @registration.blank?
  end

  def user_can_modify_registration
    new_status = params.dig('competing', 'status')
    target_user = @registration.user
    raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::COMPETITOR_LIMIT_REACHED) if
      will_exceed_competitor_limit?(params.require('requests'), @competition)
    raise WcaExceptions::RegistrationError.new(:unauthorized, Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless
      can_administer_or_current_user?(@competition, @current_user, target_user)
    raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED) unless
      @competition.registration_edits_currently_permitted? || @current_user.can_manage_competition?(@competition) || user_uncancelling_registration?(@registration, new_status)
    raise WcaExceptions::RegistrationError.new(:unauthorized, Registrations::ErrorCodes::REGISTRATION_IS_REJECTED) if
      user_is_rejected?(@current_user, target_user, @registration) && !organizer_modifying_own_registration?(@competition, @current_user, target_user)
    raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::ALREADY_REGISTERED_IN_SERIES) if
      existing_registration_in_series?(@competition, target_user) && !current_user.can_manage_competition?(@competition)
  end

  def validate_update_request
    Registrations::RegistrationChecker.update_registration_allowed!(params, @registration, @competition, @current_user)
  end

  def user_can_bulk_modify_registrations
    @competition = Competition.find(params['competition_id'])

    raise WcaExceptions::BulkUpdateError.new(:unauthorized, [Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS]) unless
      current_user.can_manage_competition?(@competition)
  end

  def validate_bulk_update_request
    errors = {}
    params['requests'].each do |update_request|
      registration = Registration.find_by(competition: @competition, user_id: update_request['user_id'])
      raise WcaExceptions::RegistrationError.new(:not_found, Registrations::ErrorCodes::REGISTRATION_NOT_FOUND) if registration.blank?

      Registrations::RegistrationChecker.update_registration_allowed!(params, registration, @competition, @current_user)
    rescue WcaExceptions::RegistrationError => e
      errors[update_request['user_id']] = e.error
    end

    raise WcaExceptions::BulkUpdateError.new(:unprocessable_entity, errors) unless errors.empty?
  end

  def bulk_update
    updated_registrations = {}
    update_requests = params[:requests]

    update_requests.each do |update|
      updated_registrations[update['user_id']] = Registrations::Lanes::Competing.update!(update, @competition, @current_user.id)
    end

    render json: { status: 'ok', updated_registrations: updated_registrations }
  end

  def list
    competition_id = list_params
    competition = Competition.find(competition_id)
    registrations = competition.registrations.accepted.competing
    payload = Rails.cache.fetch([
                                  "registrations_v2_list",
                                  competition.id,
                                  competition.event_ids,
                                  registrations.joins(:user).order(:id).pluck(:id, :updated_at, user: [:updated_at]),
                                ]) do
      registrations.includes(:user).map { |r| r.to_v2_json }
    end
    render json: payload
  end

  # To list Registrations in the admin view you need to be able to administer the competition
  def validate_list_admin
    competition_id = list_params
    # TODO: Do we set this as an instance variable here so we can use it below?
    @competition = Competition.find(competition_id)
    render_error(:unauthorized, Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless @current_user.can_manage_competition?(@competition)
  end

  def list_admin
    registrations = Registration.where(competition: @competition)
    render json: registrations.includes(
      :events,
      :competition_events,
      :registration_competition_events,
      competition: :competition_payment_integrations,
      user: :delegate_role_metadata,
      registration_payments: :receipt,
      registration_history_entries: :registration_history_changes,
    ).map { |r| r.to_v2_json(admin: true, history: true, pii: true) }
  end

  def validate_payment_ticket_request
    competition_id = params[:competition_id]
    @competition = Competition.find(competition_id)
    return render_error(:forbidden, Registrations::ErrorCodes::PAYMENT_NOT_ENABLED) unless @competition.using_payment_integrations?

    return render_error(:forbidden, Registrations::ErrorCodes::REGISTRATION_CLOSED) if @competition.registration_past?

    @registration = Registration.find_by(user: @current_user, competition: @competition)
    render_error(:forbidden, Registrations::ErrorCodes::PAYMENT_NOT_READY) if @registration.nil?
  end

  def payment_ticket
    donation = params[:donation_iso].to_i || 0
    amount_iso = @competition.base_entry_fee_lowest_denomination
    currency_iso = @competition.currency_code
    payment_account = @competition.payment_account_for(:stripe)
    payment_intent = payment_account.prepare_intent(@registration, amount_iso + donation, currency_iso, @current_user)
    render json: { client_secret: payment_intent.client_secret }
  end

  private

    def action_type(request)
      self_updating = request[:user_id] == @current_user
      status = request.dig('competing', 'status')
      if status == 'cancelled'
        return self_updating ? 'Competitor delete' : 'Admin delete'
      end

      self_updating ? 'Competitor update' : 'Admin update'
    end

    def registration_params
      params.require([:user_id, :competition_id])
      params.require(:competing).require(:event_ids)
      params
    end

    def show_params
      user_id, competition_id = params.require([:user_id, :competition_id])
      [user_id.to_i, competition_id]
    end

    def update_params
      params.require([:user_id, :competition_id])
      params.permit(:guests, competing: [:status, :comment, { event_ids: [] }, :admin_comment])
    end

    def list_params
      params.require(:competition_id)
    end

    # Some of these are currently duplicated while migrating from registration_checker

    def organizer_modifying_own_registration?(competition, current_user, target_user)
      (current_user.id == target_user.id) && current_user.can_manage_competition?(competition)
    end

    def user_uncancelling_registration?(registration, new_status)
      registration.competing_status_cancelled? && new_status == Registrations::Helper::STATUS_PENDING
    end

    def can_administer_or_current_user?(competition, current_user, target_user)
      # Only an organizer or the user themselves can create a registration for the user
      # One case where organizers need to create registrations for users is if a 3rd-party registration system is being used, and registration data is being
      # passed to the Registration Service from it
      (current_user.id == target_user.id) || current_user.can_manage_competition?(competition)
    end

    def user_is_rejected?(current_user, target_user, registration)
      current_user.id == target_user.id && registration.rejected?
    end

    def existing_registration_in_series?(competition, target_user)
      return false unless competition.part_of_competition_series?

      other_series_ids = competition.other_series_ids
      other_series_ids.any? do |comp_id|
        Registration.find_by(competition_id: comp_id, user_id: target_user.id)&.might_attend?
      end
    end

    def will_exceed_competitor_limit?(update_requests, competition)
      registrations_to_be_accepted = update_requests.count { |r| r.dig('competing', 'status') == Registrations::Helper::STATUS_ACCEPTED }
      total_accepted_registrations_after_update = competition.registrations.accepted_count + registrations_to_be_accepted

      competition.competitor_limit_enabled &&
        registrations_to_be_accepted > 0 &&
        total_accepted_registrations_after_update > competition.competitor_limit
    end
end
