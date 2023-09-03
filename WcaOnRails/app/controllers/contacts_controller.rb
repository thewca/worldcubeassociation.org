# frozen_string_literal: true

class ContactsController < ApplicationController
  def website
    @contact = WebsiteContact.new(your_email: current_user&.email, name: current_user&.name,
                                  competition_id: params[:competition_id],
                                  inquiry: params[:competition_id] ? "competition" : nil)
  end

  def website_create
    @contact = WebsiteContact.new(params[:website_contact])
    @contact.request = request
    maybe_send_email success_url: contact_website_url, fail_view: :website
  end

  def dob
    @contact = DobContact.new(your_email: current_user&.email)
  end

  def dob_create
    @contact = DobContact.new(params[:dob_contact])
    @contact.request = request
    @contact.to_email = "results@worldcubeassociation.org"
    @contact.subject = "WCA DOB change request by #{@contact.name}"
    maybe_send_email success_url: contact_dob_url, fail_view: :dob
  end

  private def maybe_send_email(success_url: nil, fail_view: nil)
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
