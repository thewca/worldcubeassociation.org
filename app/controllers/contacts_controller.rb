# frozen_string_literal: true

class ContactsController < ApplicationController
  def website_create
    user_data = params.require(:userData)
    name = user_data[:name]
    email = user_data[:email]
    contact_recipient = params.require(:contactRecipient)
    website_contact = WebsiteContact.new(
      your_email: email,
      name: name,
      inquiry: contact_recipient,
    )
    contact_params = params.require(contact_recipient)
    website_contact.competition_id = contact_params[:competitionId] if contact_recipient == 'competition'
    website_contact.message = contact_params[:message]
    website_contact.request = request
    website_contact.logged_in_email = current_user&.email || 'None'
    maybe_send_contact_email(website_contact)
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

  private def maybe_send_contact_email(website_contact)
    if !website_contact.valid?
      render json: { error: "invalid" }
    elsif website_contact.deliver
      render json: { status: "ok" }
    else
      render json: { error: "mail_delivery_error" }
    end
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
