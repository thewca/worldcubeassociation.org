# frozen_string_literal: true

class ContactsController < ApplicationController
  private def maybe_send_contact_email(contact)
    if !contact.valid?
      render status: :bad_request, json: { error: "Invalid contact object created" }
    elsif contact.deliver
      render status: :ok, json: { message: "Mail sent successfully" }
    else
      render status: :internal_server_error, json: { error: "Mail delivery failed" }
    end
  end

  private def contact_competition(requestor_details, contact_params)
    maybe_send_contact_email(
      ContactCompetition.new(
        name: requestor_details[:name],
        your_email: requestor_details[:email],
        message: contact_params[:message],
        competition_id: contact_params[:competitionId],
        request: request,
        logged_in_email: current_user&.email || 'None',
      ),
    )
  end

  private def contact_wct(requestor_details, contact_params)
    maybe_send_contact_email(
      ContactWct.new(
        name: requestor_details[:name],
        your_email: requestor_details[:email],
        message: contact_params[:message],
        request: request,
        logged_in_email: current_user&.email || 'None',
      ),
    )
  end

  private def contact_wrt(requestor_details, contact_params)
    maybe_send_contact_email(
      ContactWrt.new(
        name: requestor_details[:name],
        your_email: requestor_details[:email],
        message: contact_params[:message],
        request: request,
        logged_in_email: current_user&.email || 'None',
      ),
    )
  end

  private def contact_wst(requestor_details, contact_params)
    maybe_send_contact_email(
      ContactWst.new(
        name: requestor_details[:name],
        your_email: requestor_details[:email],
        message: contact_params[:message],
        request_id: contact_params[:requestId],
        request: request,
        logged_in_email: current_user&.email || 'None',
      ),
    )
  end

  def contact
    formValues = JSON.parse(params.require(:formValues), symbolize_names: true)
    contact_recipient = formValues[:contactRecipient]
    contact_params = formValues[contact_recipient.to_sym]
    requestor_details = current_user || formValues[:userData]

    render status: :bad_request, json: { error: "Invalid arguments" } if contact_recipient.nil? || contact_params.nil? || requestor_details.nil?

    case contact_recipient
    when UserGroup.teams_committees_group_wct.metadata.friendly_id
      contact_wct(requestor_details, contact_params)
    when UserGroup.teams_committees_group_wrt.metadata.friendly_id
      contact_wrt(requestor_details, contact_params)
    when UserGroup.teams_committees_group_wst.metadata.friendly_id
      contact_wst(requestor_details, contact_params)
    when "competition"
      contact_competition(requestor_details, contact_params)
    else
      render status: :bad_request, json: { error: "Invalid contact recipient" }
    end
  end

  def dob
    @contact = DobContact.new(your_email: current_user&.email)
  end

  def dob_create
    @contact = DobContact.new(params[:dob_contact])
    @contact.request = request
    @contact.to_email = "results@worldcubeassociation.org"
    @contact.subject = "WCA DOB change request by #{@contact.name}"
    maybe_send_dob_email success_url: contact_dob_url, fail_view: :dob
  end

  private def maybe_send_dob_email(success_url: nil, fail_view: nil)
    if !@contact.valid?
      render fail_view
    elsif !verify_recaptcha
      # Convert flash to a flash.now, since we're about to render, not redirect.
      flash.now[:recaptcha_error] = flash[:recaptcha_error]
      render fail_view
    elsif @contact.deliver
      flash[:success] = I18n.t('contacts.messages.success')
      redirect_to success_url
    else
      flash.now[:danger] = I18n.t('contacts.messages.delivery_error')
      render fail_view
    end
  end
end
