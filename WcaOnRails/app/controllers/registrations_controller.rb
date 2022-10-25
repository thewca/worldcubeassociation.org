# frozen_string_literal: true

require "csv"

class RegistrationsController < ApplicationController
  before_action :authenticate_user!, except: [:new, :create, :index, :psych_sheet, :psych_sheet_event, :register]

  private def competition_from_params
    competition = if params[:competition_id]
                    Competition.find(params[:competition_id])
                  else
                    Registration.find(params[:id]).competition
                  end
    unless competition.user_can_view?(current_user)
      raise ActionController::RoutingError.new('Not Found')
    end
    competition
  end

  before_action -> { redirect_to_root_unless_user(:can_manage_competition?, competition_from_params) },
                except: [:new, :create, :index, :psych_sheet, :psych_sheet_event, :register, :register_require_sign_in, :payment_success, :process_payment_intent, :destroy, :update]

  before_action :competition_must_be_using_wca_registration!, except: [:import, :do_import, :add, :do_add, :index, :psych_sheet, :psych_sheet_event]
  private def competition_must_be_using_wca_registration!
    if !competition_from_params.use_wca_registration?
      flash[:danger] = I18n.t('registrations.flash.not_using_wca')
      redirect_to competition_path(competition_from_params)
    end
  end

  before_action :competition_must_not_be_using_wca_registration!, only: [:import, :do_import]
  private def competition_must_not_be_using_wca_registration!
    if competition_from_params.use_wca_registration?
      redirect_to competition_path(competition_from_params)
    end
  end

  def edit_registrations
    @show_events = params[:show_events] == "true"
    @show_full_emails = params[:show_full_emails] == "true"
    @show_birthdays = params[:show_birthdays] == "true"
    @run_validations = params[:run_validations] == "true"

    @competition = competition_from_params
    @registrations = @competition.registrations.includes(:user, :registration_payments, :events)
  end

  def psych_sheet
    @competition = competition_from_params
    most_main_event = @competition.events.min_by(&:rank)
    redirect_to competition_psych_sheet_event_url(@competition.id, most_main_event.id)
  end

  def psych_sheet_event
    @competition = competition_from_params
    @event = Event.c_find(params[:event_id])
    if @competition.results_posted?
      render :psych_results_posted
      return
    end

    @psych_sheet = @competition.psych_sheet_event(@event, params[:sort_by])
  end

  def index
    @competition = competition_from_params
    @registrations = @competition.registrations.accepted.includes(:user, :events).order("users.name")
    @count_by_event = Hash.new(0)
    @newcomers = @returners = 0
  end

  def edit
    @registration = Registration.find(params[:id])
    @competition = @registration.competition
  end

  def destroy
    @competition = competition_from_params
    @registration = Registration.find(params[:id])
    if params.key?(:user_is_deleting_theirself)
      if current_user.can_edit_registration?(@registration)
        @registration.update!(deleted_at: Time.now, deleted_by: current_user.id)
        RegistrationsMailer.notify_organizers_of_deleted_registration(@registration).deliver_later
        flash[:success] = I18n.t('registrations.flash.deleted', comp: @competition.name)
      else
        flash[:danger] = I18n.t('registrations.flash.cannot_delete')
      end
      redirect_to competition_register_path(@competition)
    elsif current_user.can_manage_competition?(@competition)
      @registration.update!(deleted_at: Time.now, deleted_by: current_user.id)
      mailer = RegistrationsMailer.notify_registrant_of_deleted_registration(@registration)
      mailer.deliver_later
      flash[:success] = I18n.t('registrations.flash.single_deletion_and_mail', mail: mailer.to.join(" "))
      redirect_to competition_edit_registrations_path(@registration.competition)
    end
  end

  private def selected_registrations_ids
    params[:selected_registrations].map { |r| r.split('-')[1] }
  end

  def export
    @competition = competition_from_params
    @registrations = @competition.registrations.order(:id).includes(:user, :events).find(selected_registrations_ids)

    respond_to do |format|
      format.csv do
        headers['Content-Disposition'] = "attachment; filename=\"#{@competition.id}-registration.csv\""
        headers['Content-Type'] ||= 'text/csv; charset=UTF-8'
      end
    end
  end

  def import
    @competition = competition_from_params
  end

  def do_import
    competition = competition_from_params
    file = params[:registrations_import][:registrations_file]
    required_columns = ["status", "name", "country", "wca id", "birth date", "gender", "email"] + competition.events.map(&:id)
    # Ensure the CSV file includes all required columns.
    headers = CSV.read(file.path).first.compact.map(&:downcase)
    missing_headers = required_columns - headers
    if missing_headers.any?
      raise I18n.t("registrations.import.errors.missing_columns", columns: missing_headers.join(", "))
    end
    registration_rows = CSV.read(file.path, headers: true, header_converters: :symbol, skip_blanks: true, converters: ->(string) { string&.strip })
                           .map(&:to_hash)
                           .select { |registration_row| registration_row[:status] == "a" }
    if competition.competitor_limit_enabled? && registration_rows.length > competition.competitor_limit
      raise I18n.t("registrations.import.errors.over_competitor_limit",
                   accepted_count: registration_rows.length,
                   limit: competition.competitor_limit)
    end
    emails = registration_rows.map { |registration_row| registration_row[:email] }
    email_duplicates = emails.select { |email| emails.count(email) > 1 }.uniq
    if email_duplicates.any?
      raise I18n.t("registrations.import.errors.email_duplicates", emails: email_duplicates.join(", "))
    end
    wca_ids = registration_rows.map { |registration_row| registration_row[:wca_id] }
    wca_id_duplicates = wca_ids.select { |wca_id| wca_ids.count(wca_id) > 1 }.uniq
    if wca_id_duplicates.any?
      raise I18n.t("registrations.import.errors.wca_id_duplicates", wca_ids: wca_id_duplicates.join(", "))
    end
    new_locked_users = []
    ActiveRecord::Base.transaction do
      competition.registrations.accepted.each do |registration|
        unless emails.include?(registration.user.email)
          registration.update!(deleted_at: Time.now, deleted_by: current_user.id)
        end
      end
      registration_rows.each do |registration_row|
        user, locked_account_created = user_for_registration!(registration_row)
        new_locked_users << user if locked_account_created
        registration = competition.registrations.find_or_initialize_by(user_id: user.id)
        unless registration.accepted?
          registration.assign_attributes(accepted_at: Time.now, accepted_by: current_user.id, deleted_at: nil)
        end
        registration.registration_competition_events = []
        competition.competition_events.map do |competition_event|
          value = registration_row[competition_event.event_id.to_sym]
          if value == "1"
            registration.registration_competition_events.build(competition_event_id: competition_event.id)
          elsif value != "0"
            raise I18n.t("registrations.import.errors.invalid_event_column", value: value, column: competition_event.event_id)
          end
        end
        registration.save!
      rescue StandardError => e
        raise e.exception(I18n.t("registrations.import.errors.error", registration: registration_row[:name], error: e))
      end
    end
    new_locked_users.each do |user|
      RegistrationsMailer.notify_registrant_of_locked_account_creation(user, competition).deliver_later
    end
    flash[:success] = I18n.t("registrations.flash.imported")
    redirect_to competition_registrations_import_url(competition)
  rescue StandardError => e
    flash[:danger] = e.to_s
    redirect_to competition_registrations_import_url(competition)
  end

  def add
    @competition = competition_from_params
  end

  def do_add
    @competition = competition_from_params
    if @competition.registration_full?
      flash[:danger] = I18n.t("registrations.mailer.deleted.causes.registrations_full")
      redirect_to competition_path(@competition)
      return
    end
    ActiveRecord::Base.transaction do
      user, locked_account_created = user_for_registration!(params[:registration_data])
      registration = @competition.registrations.find_or_initialize_by(user_id: user.id)
      raise I18n.t("registrations.add.errors.already_registered") unless registration.new_record?
      registration.assign_attributes(accepted_at: Time.now, accepted_by: current_user.id)
      params[:registration_data][:event_ids]&.each do |event_id|
        competition_event = @competition.competition_events.find { |ce| ce.event_id == event_id }
        registration.registration_competition_events.build(competition_event_id: competition_event.id)
      end
      registration.save!
      if locked_account_created
        RegistrationsMailer.notify_registrant_of_locked_account_creation(user, @competition).deliver_later
      end
    end
    flash[:success] = I18n.t("registrations.flash.added")
    redirect_to competition_registrations_add_url(@competition)
  rescue StandardError => e
    flash.now[:danger] = e.to_s
    render :add
  end

  private def user_for_registration!(registration_row)
    registration_row[:wca_id]&.upcase!
    registration_row[:email]&.downcase!
    person_details = {
      name: registration_row[:name],
      country_iso2: Country.c_find(registration_row[:country]).iso2,
      gender: registration_row[:gender],
      dob: registration_row[:birth_date],
    }
    if registration_row[:wca_id].present?
      unless Person.exists?(wca_id: registration_row[:wca_id])
        raise I18n.t("registrations.import.errors.non_existent_wca_id", wca_id: registration_row[:wca_id])
      end
      user = User.find_by(wca_id: registration_row[:wca_id])
      if user
        if user.dummy_account?
          email_user = User.find_by(email: registration_row[:email])
          if email_user
            if email_user.wca_id.present?
              raise I18n.t("registrations.import.errors.email_user_with_different_wca_id",
                           email: registration_row[:email], user_wca_id: email_user.wca_id,
                           registration_wca_id: registration_row[:wca_id])
            else
              # User hooks will also remove the dummy user account.
              email_user.update!(wca_id: registration_row[:wca_id], **person_details)
              [email_user, false]
            end
          else
            user.skip_reconfirmation!
            user.update!(dummy_account: false, **person_details, email: registration_row[:email])
            [user, true]
          end
        else
          [user, false] # Use this account.
        end
      else
        email_user = User.find_by(email: registration_row[:email])
        if email_user
          if email_user.unconfirmed_wca_id.present? && email_user.unconfirmed_wca_id != registration_row[:wca_id]
            raise I18n.t("registrations.import.errors.email_user_with_different_unconfirmed_wca_id",
                         email: registration_row[:email], unconfirmed_wca_id: email_user.unconfirmed_wca_id,
                         registration_wca_id: registration_row[:wca_id])
          else
            email_user.update!(wca_id: registration_row[:wca_id], **person_details)
            [email_user, false]
          end
        else
          # Create a locked account with confirmed WCA ID.
          [create_locked_account!(registration_row), true]
        end
      end
    else
      email_user = User.find_by(email: registration_row[:email])
      # Use the user if exists, otherwise create a locked account without WCA ID.
      if email_user
        unless email_user.wca_id.present?
          # If this is just a user account with no WCA ID, update its data.
          # Given it's verified by organizers, it's more trustworthy/official data (if different at all).
          email_user.update!(person_details)
        end
        [email_user, false]
      else
        [create_locked_account!(registration_row), true]
      end
    end
  end

  private def create_locked_account!(registration_row)
    User.new_locked_account(
      name: registration_row[:name],
      email: registration_row[:email],
      wca_id: registration_row[:wca_id],
      country_iso2: Country.c_find(registration_row[:country]).iso2,
      gender: registration_row[:gender],
      dob: registration_row[:birth_date],
    ).tap { |user| user.save! }
  end

  def do_actions_for_selected
    @show_events = params[:show_events] == "true"
    @show_full_emails = params[:show_full_emails] == "true"
    @show_birthdays = params[:show_birthdays] == "true"
    @competition = competition_from_params
    registrations = @competition.registrations.find(selected_registrations_ids)
    count_success = 0
    registration_errors = []
    @registration_error_ids = []

    case params[:registrations_action]
    when "accept-selected"
      registrations.each do |registration|
        if !registration.accepted?
          if registration.update(accepted_at: Time.now, accepted_by: current_user.id, deleted_at: nil)
            count_success += 1
            RegistrationsMailer.notify_registrant_of_accepted_registration(registration).deliver_later
          else
            @registration_error_ids << registration.id
            registration_errors << "#{registration.user.name}: #{registration.errors.full_messages.join(', ')}"
          end
        end
      end
      if count_success > 0
        flash.now[:success] = I18n.t('registrations.flash.accepted_and_mailed', count: count_success)
      end
    when "reject-selected"
      registrations.each do |registration|
        if !registration.pending?
          if registration.update(accepted_at: nil, deleted_at: nil)
            count_success += 1
            RegistrationsMailer.notify_registrant_of_pending_registration(registration).deliver_later
          else
            @registration_error_ids << registration.id
            registration_errors << "#{registration.user.name}: #{registration.errors.full_messages.join(', ')}"
          end
        end
      end
      if count_success > 0
        flash.now[:warning] = I18n.t('registrations.flash.rejected_and_mailed', count: count_success)
      end
    when "delete-selected"
      registrations.each do |registration|
        if !registration.deleted?
          if registration.update(deleted_at: Time.now, deleted_by: current_user.id)
            count_success += 1
            RegistrationsMailer.notify_registrant_of_deleted_registration(registration).deliver_later
          else
            @registration_error_ids << registration.id
            registration_errors << "#{registration.user.name}: #{registration.errors.full_messages.join(', ')}"
          end
        end
      end
      if count_success > 0
        flash.now[:warning] = I18n.t('registrations.flash.deleted_and_mailed', count: count_success)
      end
    when "export-selected"
    else
      raise "Unrecognized action #{params[:registrations_action]}"
    end

    unless registration_errors.empty?
      flash.now[:danger] = "Failed to update: #{registration_errors.join('; ')}"
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
    if params[:from_admin_view] && @registration.updated_at.to_time != params[:registration][:updated_at].to_time
      flash.now[:danger] = "Did not update registration because competitor updated registration since the page was loaded."
      render :edit
      return
    end
    registration_attributes = registration_params
    was_accepted = @registration.accepted?
    was_deleted = @registration.deleted?
    # The only case we go to this endpoint if the registration was deleted is when we register again.
    if was_deleted
      # Set the accepted_at/deleted_at to nil iff it's not already set,
      # which can happen when moving from deleted to accepted.
      registration_attributes = { accepted_at: nil, deleted_at: nil }.merge(registration_attributes)
    end
    # Don't rely on the status in the params, compute the new status from the
    # timestamps.
    new_status = Registration.status_from_timestamp(registration_attributes[:accepted_at], registration_attributes[:deleted_at])
    # Don't change status columns if the status is the same.
    if @registration.checked_status == new_status
      registration_attributes = registration_attributes.except(:accepted_at, :accepted_by, :deleted_at, :deleted_by)
    end
    if current_user.can_edit_registration?(@registration) && @registration.update(registration_attributes)
      if !was_accepted && @registration.accepted?
        mailer = RegistrationsMailer.notify_registrant_of_accepted_registration(@registration)
        mailer.deliver_later
        flash[:success] = "Accepted registration and emailed #{mailer.to.join(" ")}"
      elsif was_accepted && @registration.pending?
        mailer = RegistrationsMailer.notify_registrant_of_pending_registration(@registration)
        mailer.deliver_later
        flash[:success] = "Moved registration to the waiting list and emailed #{mailer.to.join(" ")}"
      elsif !was_deleted && @registration.deleted?
        mailer = RegistrationsMailer.notify_registrant_of_deleted_registration(@registration)
        mailer.deliver_later
        flash[:success] = "Deleted registration and emailed #{mailer.to.join(" ")}"
      else
        flash[:success] = I18n.t('registrations.flash.updated')
      end
      if params[:from_admin_view]
        redirect_to edit_registration_path(@registration)
      else
        redirect_to competition_register_path(@registration.competition)
      end
    else
      flash.now[:danger] = I18n.t('registrations.flash.failed')
      if params[:from_admin_view]
        render :edit
      else
        @selected_events = @registration.saved_and_unsaved_events
        render :register
      end
    end
  end

  def register_require_sign_in
    @competition = competition_from_params
    redirect_to competition_register_path(@competition)
  end

  def register
    @competition = competition_from_params
    @registration = nil
    @selected_events = []
    if current_user
      @registration = @competition.registrations.find_or_initialize_by(user_id: current_user.id, competition_id: @competition.id)
      @selected_events = @registration.saved_and_unsaved_events.empty? ? @registration.user.preferred_events : @registration.saved_and_unsaved_events
    end
  end

  def payment_success
    @competition = competition_from_params
    flash[:success] = t("registrations.payment_form.payment_successful")
    redirect_to competition_register_path(@competition)
  end

  # This method implements the synchronous workflow described here: https://stripe.com/docs/payments/payment-intents/web-manual
  # It does:
  #   - if payment method id is sent by Stripe, generate a payment intent
  #     - if PI is successful, register the payment and say it's ok
  #     - if card error, register the payment as failure
  #     - if not, ask for extra action (ie: 3D secure) to the user
  #   - if payment intent id is sent by Stripe, try confirm it
  #     - if success, register the payment and say it's ok
  #     - if not, register the payment as failure
  def process_payment_intent
    registration = Registration.includes(:user, :competition).find(params[:id])
    user = registration&.user
    unless user == current_user
      render status: 403, json: { error: { message: t("registrations.payment_form.errors.not_allowed") } }
      return
    end
    amount = params[:amount].to_i
    if registration.outstanding_entry_fees.cents <= 0
      render json: { error: { message: t("registrations.payment_form.errors.already_paid") } }
      return
    end
    intent = nil
    stripe_charge = nil
    competition = registration.competition
    registration_metadata = {
      competition: competition.name,
      registration_url: edit_registration_url(registration),
    }
    begin
      if params[:payment_method_id]
        if amount < registration.outstanding_entry_fees.cents
          render json: { error: { message: t("registrations.payment_form.alerts.amount_too_low") } }
          return
        end
        payment_intent_args = {
          payment_method: params[:payment_method_id],
          amount: amount,
          currency: registration.outstanding_entry_fees.currency.iso_code,
          confirmation_method: "manual",
          confirm: true,
          receipt_email: user.email,
          description: "Registration payment for #{competition.name}",
          metadata: registration_metadata,
        }
        # Log the payment attempt
        stripe_charge = StripeCharge.create!(
          metadata: payment_intent_args.to_json,
          stripe_charge_id: nil,
          status: "unknown",
        )
        # Create the PaymentIntent, overriding the stripe_account for the request
        # by the connected stripe account for the competition.
        intent = Stripe::PaymentIntent.create(
          payment_intent_args,
          stripe_account: registration.competition.connected_stripe_account_id,
        )
      elsif params[:payment_intent_id]
        stripe_charge = StripeCharge.find_by(stripe_charge_id: params[:payment_intent_id])
        # We should definitely find a StripeCharge for this PI, so show an error if we don't.
        unless stripe_charge
          render json: { error: { message: t("registrations.payment_form.errors.intent_not_found") } }
          return
        end
        intent = Stripe::PaymentIntent.confirm(
          params[:payment_intent_id],
          {},
          stripe_account: registration.competition.connected_stripe_account_id,
        )
      end
    rescue Stripe::CardError => e
      # Log and display error to client
      stripe_charge.update!(status: "failure", error: e.message)
      render json: { error: { message: e.message } }
      return
    end
    status, response = generate_payment_response!(registration, intent, stripe_charge)
    render json: response, status: status
  end

  private def generate_payment_response!(registration, intent, stripe_charge)
    if intent && intent.status == "requires_action" &&
       intent.next_action.type == "use_stripe_sdk"
      # For now, since we don't have a charge, we'll keep the intent id as the charge id
      # to be able to match the log entry to an actual Stripe action.
      stripe_charge.update!(
        status: "payment_intent_registered",
        stripe_charge_id: intent.id,
      )
      # Tell the client to handle the action
      [200, { requires_action: true, payment_intent_client_secret: intent.client_secret }]
    elsif intent&.status == "succeeded"
      # FIXME: what if intent.charges.total_count is not 1?!
      intent.charges.data.each do |charge|
        registration.record_payment(
          charge.amount,
          charge.currency,
          charge.id,
          current_user.id,
        )
        stripe_charge.update!(
          status: "success",
          stripe_charge_id: charge.id,
        )
      end
      # The payment didn’t need any additional actions and is completed!
      # Handle post-payment fulfillment
      [200, { success: true }]
    else
      # Invalid status
      [500, { error: "Invalid PaymentIntent status" }]
    end
  end

  private def error_to_s(error)
    error.inspect + "\n" + error.backtrace.join("\n")
  end

  def refund_payment
    registration = Registration.find(params[:id])
    unless registration.competition.using_stripe_payments?
      flash[:danger] = "You cannot emit refund for this competition anymore. Please use your Stripe dashboard to do so."
      redirect_to edit_registration_path(registration)
      return
    end

    payment = RegistrationPayment.find(params[:payment_id])
    refund_amount_param = params.require(:payment).require(:refund_amount)
    refund_amount = refund_amount_param.to_i

    if refund_amount > payment.amount_available_for_refund
      flash[:danger] = "You are not allowed to refund more than the competitor has paid."
      redirect_to edit_registration_path(registration)
      return
    end
    if refund_amount < 0
      flash[:danger] = "The refund amount must be greater than zero."
      redirect_to edit_registration_path(registration)
      return
    end

    refund = Stripe::Refund.create(
      {
        charge: payment.stripe_charge_id,
        amount: refund_amount,
      },
      stripe_account: registration.competition.connected_stripe_account_id,
    )

    registration.record_refund(
      refund.amount,
      refund.currency,
      refund.id,
      payment.id,
      current_user.id,
    )

    flash[:success] = 'Payment was refunded'
    redirect_to edit_registration_path(registration)
  end

  def create
    @competition = competition_from_params
    if !@competition.registration_opened? && !@competition.user_can_pre_register?(current_user)
      flash[:danger] = "You cannot register for this competition, registration is closed"
      redirect_to competition_path(@competition)
      return
    end
    @registration = @competition.registrations.build(registration_params.merge(user_id: current_user.id))
    if @registration.save
      flash[:success] = I18n.t('registrations.flash.registered')
      RegistrationsMailer.notify_organizers_of_new_registration(@registration).deliver_later
      RegistrationsMailer.notify_registrant_of_new_registration(@registration).deliver_later
      redirect_to competition_register_path
    else
      @selected_events = @registration.saved_and_unsaved_events
      render :register
    end
  end

  private def registration_params
    permitted_params = [
      :guests,
      :comments,
      { registration_competition_events_attributes: [:id, :competition_event_id, :_destroy] },
    ]
    if current_user.can_manage_competition?(competition_from_params)
      permitted_params += [
        :accepted_at,
        :deleted_at,
        :accepted_by,
        :deleted_by,
      ]
      params[:registration].merge! case params[:registration][:status]
                                   when "accepted"
                                     { accepted_at: Time.now, accepted_by: current_user.id, deleted_at: nil }
                                   when "deleted"
                                     { deleted_at: Time.now, deleted_by: current_user.id }
                                   else
                                     { accepted_at: nil, deleted_at: nil }
                                   end
    end
    params.require(:registration).permit(*permitted_params)
  end
end
