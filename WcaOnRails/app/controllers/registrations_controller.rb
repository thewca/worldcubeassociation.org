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

  before_action :competition_must_be_using_wca_registration!, except: [:import, :do_import, :index, :psych_sheet, :psych_sheet_event]
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

  before_action -> { redirect_to_root_unless_user(:can_manage_competition?, competition_from_params) }, only: [:edit_registrations, :do_actions_for_selected, :edit, :refund_payment]

  def edit_registrations
    @show_events = params[:show_events] == "true"
    @competition = competition_from_params
    @registrations = @competition.registrations.includes(:user, :registration_payments)
    @registrations = @registrations.includes(:events) if @show_events
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
      if !current_user.can_edit_registration?(@registration)
        flash[:danger] = I18n.t('registrations.flash.cannot_delete')
      else
        @registration.update!(deleted_at: Time.now, deleted_by: current_user.id)
        RegistrationsMailer.notify_organizers_of_deleted_registration(@registration).deliver_later
        flash[:success] = I18n.t('registrations.flash.deleted', comp: @competition.name)
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
      raise "Missing columns: #{missing_headers.to_sentence}."
    end
    registration_rows = CSV.read(file.path, headers: true, header_converters: :symbol, skip_blanks: true, converters: ->(string) { string&.strip })
                           .map(&:to_hash)
                           .select { |registration_row| registration_row[:status] == "a" }
    if competition.competitor_limit_enabled? && registration_rows.length > competition.competitor_limit
      raise "The given file includes #{registration_rows.length} accepted #{"registration".pluralize(registration_rows.length)}"\
            ", which is more than the competitor limit of #{competition.competitor_limit}."
    end
    new_locked_users = []
    ActiveRecord::Base.transaction do
      accepted_emails = registration_rows.map { |registration_row| registration_row[:email] }
      competition.registrations.accepted.each do |registration|
        unless accepted_emails.include?(registration.user.email)
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
            raise "Event columns should include either 0 or 1, found #{value} in column #{competition_event.event_id}."
          end
        end
        registration.save!
      end
    end
    new_locked_users.each do |user|
      RegistrationsMailer.notify_registrant_of_locked_account_creation(user, competition).deliver_later
    end
    flash[:success] = "Successfully imported registrations!"
    redirect_to competition_registrations_import_url(competition)
  rescue StandardError => e
    flash[:danger] = e.to_s
    redirect_to competition_registrations_import_url(competition)
  end

  private def user_for_registration!(registration_row)
    registration_row[:wca_id]&.upcase!
    registration_row[:email]&.downcase!
    if registration_row[:wca_id].present?
      unless Person.exists?(wca_id: registration_row[:wca_id])
        raise "Non-existent WCA ID given #{registration_row[:wca_id]}."
      end
      user = User.find_by(wca_id: registration_row[:wca_id])
      if user
        if user.dummy_account?
          email_user = User.find_by(email: registration_row[:email])
          if email_user
            if email_user.wca_id.present?
              raise "There is already a user with email #{registration_row[:email]}"\
                    ", but it has WCA ID of #{email_user.wca_id} instead of #{registration_row[:wca_id]}."
            else
              email_user.update!(wca_id: registration_row[:wca_id]) # User hooks will also remove the dummy user account.
              [email_user, false]
            end
          else
            user.skip_reconfirmation!
            user.update!(dummy_account: false, email: registration_row[:email])
            [user, true]
          end
        else
          [user, false] # Use this account.
        end
      else
        email_user = User.find_by(email: registration_row[:email])
        if email_user
          if email_user.unconfirmed_wca_id.present? && email_user.unconfirmed_wca_id != registration_row[:wca_id]
            raise "There is already a user with email #{registration_row[:email]}"\
                  ", but it has unconfirmed WCA ID of #{email_user.unconfirmed_wca_id} instead of #{registration_row[:wca_id]}."
          else
            email_user.update!(wca_id: registration_row[:wca_id])
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
          email_user.update!(
            name: registration_row[:name],
            country_iso2: Country.c_find(registration_row[:country]).iso2,
            gender: registration_row[:gender],
            dob: registration_row[:birth_date],
          )
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
    @competition = competition_from_params
    registrations = @competition.registrations.find(selected_registrations_ids)

    case params[:registrations_action]
    when "accept-selected"
      registrations.each do |registration|
        if !registration.accepted?
          registration.update!(accepted_at: Time.now, accepted_by: current_user.id, deleted_at: nil)
          RegistrationsMailer.notify_registrant_of_accepted_registration(registration).deliver_later
        end
      end
      flash.now[:success] = I18n.t('registrations.flash.accepted_and_mailed', count: registrations.length)
    when "reject-selected"
      registrations.each do |registration|
        if !registration.pending?
          registration.update!(accepted_at: nil, deleted_at: nil)
          RegistrationsMailer.notify_registrant_of_pending_registration(registration).deliver_later
        end
      end
      flash.now[:warning] = I18n.t('registrations.flash.rejected_and_mailed', count: registrations.length)
    when "delete-selected"
      registrations.each do |registration|
        registration.update!(deleted_at: Time.now, deleted_by: current_user.id)
        RegistrationsMailer.notify_registrant_of_deleted_registration(registration).deliver_later
      end
      flash.now[:warning] = I18n.t('registrations.flash.deleted_and_mailed', count: registrations.length)
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
    if params[:from_admin_view] && @registration.updated_at.to_time != params[:registration][:updated_at].to_time
      flash.now[:danger] = "Did not update registration because competitor updated registration since the page was loaded."
      render :edit
      return
    end
    registration_attributes = registration_params
    # Don't change status columns if the status is the same.
    if @registration.checked_status.to_s == params[:registration][:status]
      registration_attributes = registration_attributes.except(:accepted_at, :accepted_by, :deleted_at, :deleted_by)
    end
    was_accepted = @registration.accepted?
    was_deleted = @registration.deleted?
    if current_user.can_edit_registration?(@registration) && @registration.update_attributes(registration_attributes)
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

  def process_payment
    competition = competition_from_params
    registration = competition.registrations.find_by_user_id!(current_user&.id)

    token, amount_param = params.require(:payment).require([:stripe_token, :total_amount])
    amount = amount_param.to_i

    # 'amount' has not been checked by anyone, and could be user-crafted; validate it!
    # If 'token' is wrong, Stripe will complain.
    if amount < registration.outstanding_entry_fees.cents
      flash[:danger] = "Charge was cancelled because the amount to be charged was lower than the registration fees to pay"
      redirect_to competition_register_path
      return
    end

    charge = journaled_stripe_charge(
      {
        amount: amount,
        currency: registration.outstanding_entry_fees.currency.iso_code,
        source: token,
        description: "Registration payment for #{competition.name}",
        metadata: { "Name" => registration.user.name, "wca_id" => registration.user.wca_id, "email" => registration.user.email, "competition" => competition.name },
      },
      stripe_account: competition.connected_stripe_account_id,
    )

    registration.record_payment(
      charge.amount,
      charge.currency,
      charge.id,
    )

    flash[:success] = 'Your payment was successful.'
    redirect_to competition_register_path
  rescue Stripe::CardError, Stripe::InvalidRequestError => e
    flash[:danger] = 'Unsuccessful payment: ' + e.message
    redirect_to competition_register_path
  end

  private def journaled_stripe_charge(*stripe_charge_create_args)
    # Talk to Stripe to make a charge, but "journal" the attempt.
    #  1. Before talking to Stripe, we first create a StripeCharge in status "unknown".
    #  2. Talk to Stripe.
    #  3. After talking to Stripe, we update that StripeCharge to status to "success" or "failure".
    # If anything else happens (maybe our server crashed during step 2, or
    # between step 2 and 3), then we'll have a StripeCharge in our database
    # with "unknown" status, and we'll know to investigate it, most likely by
    # visiting our Stripe dashboard to see if the charge actually happened or not.

    stripe_charge = StripeCharge.create!(
      metadata: stripe_charge_create_args.to_json,
      stripe_charge_id: nil,
      status: "unknown",
    )

    begin
      charge = Stripe::Charge.create(*stripe_charge_create_args)
      stripe_charge.update!(
        status: "success",
        stripe_charge_id: charge.id,
      )
    rescue Stripe::CardError, Stripe::InvalidRequestError => e
      stripe_charge.update!(
        status: "failure",
        error: error_to_s(e),
      )
      raise e
    rescue Exception => e # rubocop:disable Lint/RescueException
      # Note that we intentionally leave the status of the charge as "unknown" here. That's because at this
      # point, we don't know if it actually succeeded or failed. Perhaps the
      # Stripe backend fully processed our request, but there was some
      # connectivity error that caused us to not know about it.
      stripe_charge.update!(error: error_to_s(e))
      raise e
    end

    charge
  end

  private def error_to_s(error)
    error.inspect + "\n" + error.backtrace.join("\n")
  end

  def refund_payment
    registration = Registration.find(params[:id])
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
    )

    flash[:success] = 'Payment was refunded'
    redirect_to edit_registration_path(registration)
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
      :accepted_at,
      :deleted_at,
      registration_competition_events_attributes: [:id, :competition_event_id, :_destroy],
    ]
    params[:registration][:deleted_at] = nil
    params[:registration][:accepted_at] = nil
    if current_user.can_manage_competition?(competition_from_params)
      permitted_params += [
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
