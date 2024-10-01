# frozen_string_literal: true

require 'securerandom'
require 'jwt'
require 'time'

class Api::V1::Registrations::RegistrationsController < Api::V1::ApiController
  skip_before_action :validate_jwt_token, only: [:list, :count]
  # The order of the validations is important to not leak any non public info via the API
  # That's why we should always validate a request first, before taking any other before action
  # before_actions are triggered in the order they are defined
  before_action :validate_create_request, only: [:create]
  before_action :validate_show_registration, only: [:show]
  before_action :validate_list_admin, only: [:list_admin]
  before_action :validate_update_request, only: [:update]
  before_action :validate_bulk_update_request, only: [:bulk_update]

  def show
    registration = get_single_registration(@user_id, @competition_id)
    render json: registration
  rescue ActiveRecord::RecordNotFound
    render json: {}, status: :not_found
  rescue WcaExceptions::RegistrationError => e
    render_error(e.http_status, e.error)
  end

  def create
    # Currently we only have one lane
    if params[:competing]
      competing_params = params[:competing].permit(:comment, :guests, :event_ids => [])

      message_deduplication_id = "competing-registration-#{@competition_id}-#{@user_id}"
      message_group_id = @competition_id

      AddRegistrationJob.set(message_group_id: message_group_id, message_deduplication_id: message_deduplication_id)
                        .perform_later("competing", @competition_id, @user_id, competing_params)
      return render json: { status: 'accepted', message: 'Started Registration Process' }, status: :accepted
    end

    render json: { status: 'bad request', message: 'You need to supply at least one lane' }, status: :bad_request
  end

  def validate_create_request
    @competition_id = registration_params[:competition_id]
    @user_id = registration_params[:user_id]
    Registrations::RegistrationChecker.create_registration_allowed!(registration_params, Competition.find(@competition_id), @current_user)
  rescue WcaExceptions::RegistrationError => e
    Rails.logger.debug { "Create was rejected with error #{e.error} at #{e.backtrace[0]}" }
    render_error(e.http_status, e.error, e.data)
  end

  def update
    render json: { status: 'ok', registration: process_update(params) }
  end

  def validate_update_request
    @user_id = params[:user_id]
    competition_id = params[:competition_id]
    @competition = Competition.find(competition_id)

    Registrations::RegistrationChecker.update_registration_allowed!(params, @competition, @current_user)
  rescue WcaExceptions::RegistrationError => e
    render_error(e.http_status, e.error, e.data)
  end

  # You can either view your own registration or one for a competition you administer
  def validate_show_registration
    @user_id, @competition_id = show_params
    @competition = Competition.find(@competition_id)
    render_error(:unauthorized, ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless @current_user.id == @user_id.to_i || @current_user.can_manage(@competition)
  end

  def bulk_update
    updated_registrations = {}
    update_requests = params[:requests]
    update_requests.each do |update|
      updated_registrations[update['user_id']] = process_update(update)
    end

    render json: { status: 'ok', updated_registrations: updated_registrations }
  end

  def validate_bulk_update_request
    @competition_id = params.require('competition_id')
    competition = Competition.find(@competition_id)
    Registrations::RegistrationChecker.bulk_update_allowed!(params, competition, @current_user)
  rescue BulkUpdateError => e
    Rails.logger.debug { "Bulk update was rejected with error #{e.errors} at #{e.backtrace[0]}" }
    render_error(e.http_status, e.errors)
  rescue NoMethodError => e
    Rails.logger.debug { "Bulk update was rejected with error #{e.exception} at #{e.backtrace[0]}" }
    render_error(:unprocessable_entity, ErrorCodes::INVALID_REQUEST_DATA)
  end

  # Shared update logic used by both `update` and `bulk_update`
  def process_update(update_request)
    guests = update_request[:guests]
    status = update_request.dig('competing', 'status')
    comment = update_request.dig('competing', 'comment')
    event_ids = update_request.dig('competing', 'event_ids')
    admin_comment = update_request.dig('competing', 'admin_comment')
    waiting_list_position = update_request.dig('competing', 'waiting_list_position')
    user_id = update_request[:user_id]

    registration = Registration.find_by(competition_id: @competition_id, user_id: user_id)
    old_status = registration.competing_status

    if old_status === "waiting_list" || status === "waiting_list"
      waiting_list = competition.waiting_list
    end

    changes = RegistrationHelper.update_changes(update_request['competing'], registration)
    registration.update_competing_lane!({ status: status, comment: comment, event_ids: event_ids, admin_comment: admin_comment, guests: guests, waiting_list_position: waiting_list_position }, waiting_list)
    registration.add_history_entry(changes, 'user', @current_user, action_type(update_request))

    # Only send emails when we update the competing status
    if status.present? && old_status != status
      # EmailApi.send_update_email(@competition_id, user_id, status, @current_user)
    end

    {
      user_id: registration.user_id,
      guests: registration.guests,
      competing: {
        event_ids: registration.registered_event_ids,
        registration_status: registration.competing_status,
        registered_on: registration['created_at'],
        comment: registration.comments,
        admin_comment: registration.admin_comment,
      },
      history: registration.registration_history_entry.to_a,
    }
  end


  def list
    competition_id = list_params
    registrations = get_registrations(competition_id, only_attending: true)
    render json: registrations
  rescue Dynamoid::Errors::Error => e
    # Render an error response
    Rails.logger.debug e
    Metrics.increment('registration_dynamodb_errors_counter')
    render json: { error: "Error getting registrations #{e}" },
           status: :internal_server_error
  end

  # To list Registrations in the admin view you need to be able to administer the competition
  def validate_list_admin
    competition_id = list_params
    @competition = Competition.find(competition_id)
    unless @current_user.can_manage_competition?(@competition)
      render_error(:unauthorized, ErrorCodes::USER_INSUFFICIENT_PERMISSIONS)
    end
  end

  def list_admin
    registrations = get_registrations(@competition_id)
    registrations_with_pii = add_pii(registrations)
    render json: add_waiting_list(@competition_id, registrations_with_pii)
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

    def add_pii(registrations)
      pii = RedisHelper.cache_info_by_ids('pii', registrations.pluck(:user_id)) do |ids|
        UserApi.get_user_info_pii(ids)
      end

      registrations.map do |r|
        user = pii.find { |u| u['id'] == r[:user_id] }
        r.merge(email: user['email'], dob: user['dob'])
      end
    end

    def add_waiting_list(competition_id, registrations)
      list = [] # WaitingList.find_or_create!(competition_id).entries
      return registrations if list.empty?
      registrations.map do |r|
        waiting_list_index = list.find_index(r[:user_id])
        r[:competing][:waiting_list_position] = waiting_list_index + 1 if waiting_list_index.present?
        r
      end
    end

    def get_registrations(competition_id, only_attending: false)
      if only_attending
        Registration.where(competition_id: competition_id, competing_status: 'accepted').all.map do |x|
          { user_id: x['user_id'],
            competing: {
              event_ids: x.event_ids,
            } }
        end
      else
        Registration.where(competition_id: competition_id).all.map do |x|
          { user_id: x['user_id'],
            competing: {
              event_ids: x.event_ids,
              registration_status: x.competing_status,
              registered_on: x['created_at'],
              comment: x.comment,
              admin_comment: x.admin_comment,
            },
            payment: {
              payment_status: x.payment_status,
              payment_amount_iso: x.payment_amount,
              payment_amount_human_readable: x.payment_amount_human_readable,
              updated_at: x.payment_date,
            },
            guests: x.guests }
        end
      end
    end

    def get_single_registration(user_id, competition_id)
      registration = Registration.find_by(user_id: user_id, competition_id: competition_id)
      return nil if registration.nil?
      waiting_list_position = if registration.competing_status == 'waiting_list'
                                waiting_list = WaitingList.find_or_create!(competition_id)
                                registration.waiting_list_position(waiting_list)
                              else
                                nil
                              end
      {
        user_id: registration['user_id'],
        guests: registration.guests,
        competing: {
          event_ids: registration.event_ids,
          registration_status: registration.competing_status,
          registered_on: registration['created_at'],
          comment: registration.comments,
          admin_comment: registration.administrative_notes,
          waiting_list_position: waiting_list_position,
        },
        payment: {
          # payment_status: registration.payment_status,
          # payment_amount_human_readable: registration.payment_amount_human_readable,
          # updated_at: registration.payment_date,
        },
        history: registration.registration_history,
      }
    end
end
