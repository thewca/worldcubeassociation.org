# frozen_string_literal: true

class ContactsController < ApplicationController
  CONTACT_DEFAULT_LOCALE = :en

  private def maybe_send_contact_email(contact, force_locale: nil)
    if !contact.valid?
      render status: :bad_request, json: { error: "Invalid contact object created" }
    elsif force_locale ? I18n.with_locale(force_locale) { contact.deliver } : contact.deliver
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
      force_locale: CONTACT_DEFAULT_LOCALE,
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
      force_locale: CONTACT_DEFAULT_LOCALE,
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
      force_locale: CONTACT_DEFAULT_LOCALE,
    )
  end

  def contact
    form_values = JSON.parse(params.require(:formValues), symbolize_names: true)
    contact_recipient = form_values[:contactRecipient]
    attachment = params[:attachment]
    contact_params = form_values[contact_recipient.to_sym]
    requestor_details = current_user || form_values[:userData]

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
      Country.c_find_by_iso2(value).name_in(:en)
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

  private def requestor_info(user, edit_others_profile_mode)
    requestor_role = if !edit_others_profile_mode
                       "Self"
                     elsif user.any_kind_of_delegate?
                       "Delegate"
                     else
                       "Unknown"
                     end
    "#{user.name} (#{requestor_role})"
  end

  def edit_profile_action
    form_values = JSON.parse(params.require(:formValues), symbolize_names: true)
    edited_profile_details = form_values[:editedProfileDetails]
    edit_profile_reason = form_values[:editProfileReason]
    attachment = params[:attachment]
    wca_id = form_values[:wcaId]
    person = Person.find_by(wca_id: wca_id)
    edit_others_profile_mode = current_user&.wca_id != wca_id

    if current_user.nil?
      return render status: :unauthorized, json: { error: "Cannot request profile change without login" }
    elsif edit_others_profile_mode && !current_user.has_permission?(:can_request_to_edit_others_profile)
      return render status: :unauthorized, json: { error: "Cannot request to change others profile" }
    end

    profile_to_edit = {
      name: person.name,
      country_iso2: person.country_iso2,
      gender: person.gender,
      dob: person.dob,
    }
    changes_requested = Person.fields_edit_requestable
                              .reject { |field| profile_to_edit[field].to_s == edited_profile_details[field].to_s }
                              .map do |field|
                                ContactEditProfile::EditProfileChange.new(
                                  field: field,
                                  from: profile_to_edit[field],
                                  to: edited_profile_details[field],
                                )
                              end

    ticket = TicketsEditPerson.create_ticket(wca_id, changes_requested, current_user)

    maybe_send_contact_email(
      ContactEditProfile.new(
        your_email: current_user&.email,
        name: profile_to_edit[:name],
        wca_id: wca_id,
        changes_requested: changes_requested_humanized(changes_requested),
        edit_profile_reason: edit_profile_reason,
        requestor: requestor_info(current_user, edit_others_profile_mode),
        ticket: ticket,
        document: attachment,
        request: request,
      ),
      force_locale: CONTACT_DEFAULT_LOCALE,
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
    maybe_send_dob_email success_url: contact_dob_url, fail_view: :dob, force_locale: CONTACT_DEFAULT_LOCALE
  end

  private def maybe_send_dob_email(success_url: nil, fail_view: nil, force_locale: nil)
    if !@contact.valid?
      render fail_view
    elsif !verify_recaptcha
      # Convert flash to a flash.now, since we're about to render, not redirect.
      flash.now[:recaptcha_error] = flash[:recaptcha_error]
      render fail_view
    elsif force_locale ? I18n.with_locale(force_locale) { @contact.deliver } : @contact.deliver
      flash[:success] = I18n.t('contacts.messages.success')
      redirect_to success_url
    else
      flash.now[:danger] = I18n.t('contacts.messages.delivery_error')
      render fail_view
    end
  end
end
