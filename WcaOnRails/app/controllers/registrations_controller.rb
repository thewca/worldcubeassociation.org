# frozen_string_literal: true

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

  before_action :competition_must_be_using_wca_registration!
  private def competition_must_be_using_wca_registration!
    if !competition_from_params.use_wca_registration?
      flash[:danger] = I18n.t('registrations.flash.not_using_wca')
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
    @sort_by = params[:sort_by]
    if @sort_by == @event.recommended_format.sort_by
      @sort_by_second = @event.recommended_format.sort_by_second
    elsif @sort_by == @event.recommended_format.sort_by_second
      @sort_by_second = @event.recommended_format.sort_by
      @sort_by = @event.recommended_format.sort_by_second
    else
      @sort_by = @event.recommended_format.sort_by
      @sort_by_second = @event.recommended_format.sort_by_second
    end

    @registrations = @competition.psych_sheet_event(@event, @sort_by, @sort_by_second)
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
    @registrations = @competition.registrations.includes(:user, :events).find(selected_registrations_ids)

    respond_to do |format|
      format.csv do
        headers['Content-Disposition'] = "attachment; filename=\"#{@competition.id}-registration.csv\""
        headers['Content-Type'] ||= 'text/csv; charset=UTF-8'
      end
    end
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
    if params[:from_admin_view] && @registration.updated_at.to_datetime != params[:registration][:updated_at].to_datetime
      flash.now[:danger] = "Did not update registration because competitor updated registration since the page was loaded."
      render :edit
      return
    end
    was_accepted = @registration.accepted?
    was_deleted = @registration.deleted?
    if current_user.can_edit_registration?(@registration) && @registration.update_attributes(registration_params)
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
    @selected_events ||= []
    if current_user
      @registration = Registration.find_by(user_id: current_user.id, competition_id: @competition.id) || @competition.registrations.build(user_id: current_user.id)
      @selected_events = @registration.saved_and_unsaved_events.empty? ? @registration.user.preferred_events : @registration.saved_and_unsaved_events
    end
  end

  def process_payment
    competition = competition_from_params
    if current_user
      registrations = competition.registrations
      registration = registrations.find_by_user_id!(current_user.id)
    end
    token, amount_param = params.require(:payment).require([:stripe_token, :total_amount])
    amount = amount_param.to_i

    # 'amount' has not been check by anyone, and could be user-crafted; validate it!
    # if 'token' is wrong, it's Stripe which will complain
    if amount < registration.outstanding_entry_fees.cents
      flash[:danger] = "Charge was cancelled because the amount to be charged was lower than the registration fees to pay"
      redirect_to competition_register_path
      return
    end

    charge = Stripe::Charge.create(
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
  rescue Stripe::CardError => e
    flash[:danger] = 'Unsuccessful payment: ' + e.message
    redirect_to competition_register_path
  rescue => e
    flash[:danger] = 'Something went wrong: ' + e.message
    redirect_to competition_register_path
  end

  def refund_payment
    registration = Registration.find(params[:id])
    payment = RegistrationPayment.find(params[:payment_id])

    refund = Stripe::Refund.create(
      {
        charge: payment.stripe_charge_id,
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
  rescue => e
    flash[:danger] = 'Something went wrong with the refund: ' + e.message
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
