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

  private def contact_wrt(requestor_details, contact_params, attachment)
    maybe_send_contact_email(
      ContactWrt.new(
        name: requestor_details[:name],
        your_email: requestor_details[:email],
        wca_id: User.find_by(email: requestor_details[:email])&.wca_id || 'None',
        query_type: contact_params[:queryType].titleize,
        message: contact_params[:message],
        document: attachment,
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
    attachment = params[:attachment]
    contact_params = formValues[contact_recipient.to_sym]
    requestor_details = current_user || formValues[:userData]

    return render status: :bad_request, json: { error: "Invalid arguments" } if contact_recipient.nil? || contact_params.nil? || requestor_details.nil?

    case contact_recipient
    when UserGroup.teams_committees_group_wct.metadata.friendly_id
      contact_wct(requestor_details, contact_params)
    when UserGroup.teams_committees_group_wrt.metadata.friendly_id
      contact_wrt(requestor_details, contact_params, attachment)
    when UserGroup.teams_committees_group_wst.metadata.friendly_id
      contact_wst(requestor_details, contact_params)
    when "competition"
      contact_competition(requestor_details, contact_params)
    else
      render status: :bad_request, json: { error: "Invalid contact recipient" }
    end
  end

  private def value_humanized(value, field)
    case field
    when :country_iso2
      Country.find_by(iso2: value).name_in(:en)
    when :gender
      User::GENDER_LABEL_METHOD.call(value.to_sym)
    else
      value
    end
  end

  private def changes_requested_humanized(changes_requested)
    changes_requested.map do |change|
      ContactEditProfile::EditProfileChange.new(
        field: change[:field].to_s.humanize,
        from: value_humanized(change[:from], change[:field]),
        to: value_humanized(change[:to], change[:field]),
      )
    end
  end

  def edit_profile_action
    formValues = JSON.parse(params.require(:formValues), symbolize_names: true)
    edited_profile_details = formValues[:editedProfileDetails]
    edit_profile_reason = formValues[:editProfileReason]
    attachment = params[:attachment]
    wca_id = formValues[:wcaId]

    return render status: :unauthorized, json: { error: "Cannot request profile change without login" } unless current_user.present?

    profile_to_edit = {
      name: current_user.person.name,
      country_iso2: current_user.person.country_iso2,
      gender: current_user.person.gender,
      dob: current_user.person.dob,
    }
    changes_requested = Person.fields_edit_requestable
                              .reject { |field| profile_to_edit[field].to_s == edited_profile_details[field].to_s }
                              .map { |field|
                                ContactEditProfile::EditProfileChange.new(
                                  field: field,
                                  from: profile_to_edit[field],
                                  to: edited_profile_details[field],
                                )
                              }

    maybe_send_contact_email(
      ContactEditProfile.new(
        your_email: current_user&.email,
        name: profile_to_edit[:name],
        wca_id: wca_id,
        changes_requested: changes_requested_humanized(changes_requested),
        edit_profile_reason: edit_profile_reason,
        document: attachment,
        request: request,
      ),
    )
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
