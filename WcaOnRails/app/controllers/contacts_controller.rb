# frozen_string_literal: true

class ContactsController < ApplicationController
  def website
    @contact = WebsiteContact.new(your_email: current_user&.email, name: current_user&.name)
  end

  def website_create
    @contact = WebsiteContact.new(params[:website_contact])
    @contact.request = request
    maybe_send_email success_url: contact_website_url, fail_view: :website
  end

  def fix_personal_information
    params[:fix_personal_information_contact] ||= {}
    params[:fix_personal_information_contact][:wca_id] ||= current_user&.wca_id
    @contact = FixPersonalInformationContact.new(wca_id: params[:fix_personal_information_contact][:wca_id], your_email: current_user&.email)
  end

  def fix_personal_information_create
    person_params = params.require(:fix_personal_information_contact).permit(:wca_id, :your_email, :name, :gender, :dob, :document)
    @contact = FixPersonalInformationContact.new(person_params)
    @contact.request = request
    @contact.to_email = "results@worldcubeassociation.org"
    @contact.subject = "WCA personal information change request by #{@contact.name}"
    maybe_send_email success_url: contact_fix_personal_information_url, fail_view: :fix_personal_information
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
