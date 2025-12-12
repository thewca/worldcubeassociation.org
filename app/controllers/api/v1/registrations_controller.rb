# frozen_string_literal: true

class Api::V1::RegistrationsController < Api::V1::ApiController
  skip_before_action :require_user, only: [:index]
  # The order of the validations is important to not leak any non public info via the API
  # That's why we should always validate a request first, before taking any other before action
  # before_actions are triggered in the order they are defined
  before_action :user_can_create_registration, only: [:create]
  before_action :validate_create_request, only: [:create]
  before_action :ensure_registration_exists, only: [:show_by_user]
  before_action :validate_show_registration_by_user, only: [:show_by_user]
  before_action :validate_show_registration, only: [:show]
  before_action :validate_admin_action, only: %i[index_admin bulk_auto_accept]
  before_action :load_registration_from_request, only: [:update]
  before_action :user_can_modify_registration, only: [:update]
  before_action :validate_update_request, only: [:update]
  before_action :user_can_bulk_modify_registrations, only: [:bulk_update]
  before_action :validate_bulk_update_request, only: [:bulk_update]
  before_action :validate_payment_ticket_request, only: [:payment_ticket]

  rescue_from ActiveRecord::RecordNotFound do
    render_error(:not_found, Registrations::ErrorCodes::REGISTRATION_NOT_FOUND)
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

  def index
    competition_id = params_competition_id
    competition = Competition.find(competition_id)
    registrations = competition.registrations.accepted.competing
    payload = Rails.cache.fetch([
                                  "registrations_v2_list",
                                  competition.id,
                                  competition.event_ids,
                                  registrations.joins(:user).order(:id).pluck(:id, :updated_at, user: [:updated_at]),
                                ]) do
      registrations.includes(:user).map(&:to_v2_json)
    end
    render json: payload
  end

  def validate_show_registration
    @registration_id = params_id
    @registration = Registration.find(@registration_id)
    @competition_id = @registration.competition_id
    @competition = @registration.competition
    @user_id = @registration.user_id
    render_error(:unauthorized, Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless @current_user.id == @user_id || @current_user.can_manage_competition?(@competition)
  end

  def show
    render json: @registration.to_v2_json(admin: true)
  end

  def ensure_registration_exists
    @competition_id, @user_id = params_by_user_id
    @registration = Registration.find_by(competition_id: @competition_id, user_id: @user_id)
    raise WcaExceptions::RegistrationError.new(:not_found, Registrations::ErrorCodes::REGISTRATION_NOT_FOUND) if @registration.blank?
  end

  def validate_show_registration_by_user
    @competition = Competition.find(@competition_id)
    render_error(:unauthorized, Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless @current_user.id == @user_id || @current_user.can_manage_competition?(@competition)
  end

  def show_by_user
    render json: @registration.to_v2_json(admin: true)
  end

  def registration_config
    competition = Competition.find(params[:id])
    render json: competition.available_registration_lanes(@current_user)
  end

  def create
    # Currently we only have one lane
    if params[:competing]
      user_id = @target_user.id
      competition_id = @competition.id

      AddRegistrationJob.prepare_task(user_id, competition_id)
                        .perform_later("competing", competition_id, user_id, @request)
      return render json: { status: 'accepted', message: 'Started Registration Process' }, status: :accepted
    end

    render json: { status: 'bad request', message: 'You need to supply at least one lane' }, status: :bad_request
  end

  def user_can_create_registration
    @request = payload_params
    competition_id, user_id = params_by_user_id

    @target_user = User.find(user_id)
    @competition = Competition.find(competition_id)

    raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::REGISTRATION_ALREADY_EXISTS) if
      Registration.exists?(competition: @competition, user: @target_user)

    # Only the user themselves can create a registration for the user
    raise WcaExceptions::RegistrationError.new(:unauthorized, Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless @current_user.id == @target_user.id

    # Only organizers can register when registration is closed
    raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::REGISTRATION_CLOSED) unless @competition.registration_currently_open? || current_user.can_manage_competition?(@competition)

    # Users must have the necessary permissions to compete - eg, they cannot be banned or have incomplete profiles
    raise WcaExceptions::RegistrationError.new(:unauthorized, Registrations::ErrorCodes::USER_CANNOT_COMPETE) unless @target_user.cannot_register_for_competition_reasons(@competition).empty?
  end

  def validate_create_request
    Registrations::RegistrationChecker.create_registration_allowed!(@request, @target_user, @competition)
  end

  def update
    if params[:competing]
      @registration.update_lanes!(@request, @current_user.id)
      return render json: { status: 'ok', registration: @registration.to_v2_json(admin: true) }, status: :ok
    end
    render json: { status: 'bad request', message: 'You need to supply at least one lane' }, status: :bad_request
  end

  def load_registration_from_request
    @request = payload_params

    registration_id = params_id
    @registration = Registration.includes(:competition).find(registration_id)

    @competition = @registration.competition
  end

  def user_can_modify_registration
    new_status = @request.dig('competing', 'status')
    target_user = @registration.user

    raise WcaExceptions::RegistrationError.new(:unauthorized, Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless
      can_administer_or_current_user?(@competition, @current_user, target_user)

    raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED) unless
      @competition.registration_edits_currently_permitted? || @current_user.can_manage_competition?(@competition) || user_uncancelling_registration?(@registration, new_status)

    raise WcaExceptions::RegistrationError.new(:unauthorized, Registrations::ErrorCodes::REGISTRATION_IS_REJECTED) if
      user_is_rejected?(@current_user, target_user, @registration) && !organizer_modifying_own_registration?(@competition, @current_user, target_user)

    raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::ALREADY_REGISTERED_IN_SERIES) if
      existing_registration_in_series?(@competition, target_user) && !current_user.can_manage_competition?(@competition)

    raise WcaExceptions::RegistrationError.new(:unauthorized, Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) if contains_admin_fields?(@request) && !@current_user.can_manage_competition?(@competition)

    # The rest of these are status + normal user related
    return if @current_user.can_manage_competition?(@competition)
    return if new_status.nil?

    # A competitor (ie, these restrictions don't apply to organizers) is only allowed to:
    # 1. Reactivate their registration if they previously cancelled it (ie, change status from 'cancelled' to 'pending')
    # 2. Cancel their registration, assuming they are allowed to cancel

    # User reactivating registration
    if new_status == Registrations::Helper::STATUS_PENDING
      raise WcaExceptions::RegistrationError.new(:unauthorized, Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless @registration.cancelled?

      raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::REGISTRATION_CLOSED) if
        @registration.cancelled? && !@competition.registration_currently_open?

      return # No further checks needed if status is pending
    end

    # Now that we've checked the 'pending' case, raise an error if the status is not cancelled (cancelling is the only valid action remaining)
    raise WcaExceptions::RegistrationError.new(:unauthorized, Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless
      [Registrations::Helper::STATUS_DELETED, Registrations::Helper::STATUS_CANCELLED].include?(new_status)

    # Raise an error if competition prevents users from cancelling a registration once it is accepted
    raise WcaExceptions::RegistrationError.new(:unauthorized, Registrations::ErrorCodes::ORGANIZER_MUST_CANCEL_REGISTRATION) unless
      @registration.permit_user_cancellation?
  end

  def validate_update_request
    Registrations::RegistrationChecker.update_registration_allowed!(@request, @registration)
  end

  def user_can_bulk_modify_registrations
    competition_id = params.require(:competition_id)
    @competition = Competition.find(competition_id)

    @update_requests = params.require(:requests)

    raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::COMPETITOR_LIMIT_REACHED) if
      will_exceed_competitor_limit?(@update_requests, @competition)

    raise WcaExceptions::BulkUpdateError.new(:unauthorized, [Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS]) unless
      current_user.can_manage_competition?(@competition)
  end

  def validate_bulk_update_request
    errors = {}

    @update_requests.each do |update_request|
      @registration = Registration.find_by(competition: @competition, user_id: update_request['user_id'])
      raise WcaExceptions::RegistrationError.new(:not_found, Registrations::ErrorCodes::REGISTRATION_NOT_FOUND) if @registration.blank?

      @request = update_request
      user_can_modify_registration

      Registrations::RegistrationChecker.update_registration_allowed!(update_request, @registration)
    rescue WcaExceptions::RegistrationError => e
      errors[update_request['user_id']] = e.error
    end

    raise WcaExceptions::BulkUpdateError.new(:unprocessable_entity, errors) unless errors.empty?
  end

  def bulk_update
    updated_registrations = {}

    @update_requests.each do |update|
      updated_registrations[update['user_id']] = Registrations::Lanes::Competing.update_raw!(update, @competition, @current_user.id)
    end

    render json: { status: 'ok', updated_registrations: updated_registrations }
  end

  # To list Registrations in the admin view you need to be able to administer the competition
  def validate_admin_action
    competition_id = params_competition_id
    @competition = Competition.find(competition_id)

    render_error(:unauthorized, Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless @current_user.can_manage_competition?(@competition)
  end

  def index_admin
    render json: @competition.registrations.includes(
      :events,
      :competition_events,
      :registration_competition_events,
      competition: :competition_payment_integrations,
      user: :delegate_role_metadata,
      registration_payments: :receipt,
      registration_history_entries: :registration_history_changes,
    ).map { |r| r.to_v2_json(admin: true, pii: true) }
  end

  def bulk_auto_accept
    render json: Registration.bulk_auto_accept(@competition)
  end

  def validate_payment_ticket_request
    @registration = Registration.find(params_id)
    @competition = @registration.competition

    return render_error(:forbidden, Registrations::ErrorCodes::PAYMENT_NOT_ENABLED) unless @competition.using_payment_integrations?
    return render_error(:forbidden, Registrations::ErrorCodes::REGISTRATION_CLOSED) if @competition.registration_past?

    return render_error(:forbidden, Registrations::ErrorCodes::PAYMENT_NOT_READY) if @registration.nil?

    render_error(:forbidden, Registrations::ErrorCodes::NO_OUTSTANDING_PAYMENT) if @registration.outstanding_entry_fees.zero?
  end

  def payment_ticket
    iso_donation_amount = params[:iso_donation_amount].to_i
    # We could delegate this call to the prepare_intent function given that we're already giving it registration - however,
    # in the long-term we want to decouple registrations from payments, so I'm deliberately not introducing any more tight coupling
    ruby_money = @registration.entry_fee_with_donation(iso_donation_amount)
    payment_account = @competition.payment_account_for(:stripe)
    payment_intent = payment_account.prepare_intent(@registration, ruby_money.cents, ruby_money.currency.iso_code, @current_user)
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

    def params_by_user_id
      competition_id, user_id = params.require(%i[competition_id user_id])
      [competition_id, user_id.to_i]
    end

    def params_id
      params.require(:id).to_i
    end

    def params_competition_id
      params.require(:competition_id)
    end

    def payload_params
      params.permit(:guests, competing: [:status, :comment, { event_ids: [] }, :admin_comment, :waiting_list_position])
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
      total_accepted_registrations_after_update = competition.registrations.accepted_and_competing_count + registrations_to_be_accepted

      competition.competitor_limit_enabled &&
        registrations_to_be_accepted.positive? &&
        total_accepted_registrations_after_update > competition.competitor_limit
    end

    def contains_admin_fields?(request)
      organizer_fields = %w[admin_comment waiting_list_position]

      request['competing']&.keys&.any? { |key| organizer_fields.include?(key) }
    end
end
