# frozen_string_literal: true

class TicketsController < ApplicationController
  include Rails::Pagination

  before_action :authenticate_user!

  SORT_WEIGHT_LAMBDAS = {
    createdAt:
      lambda { |ticket| ticket.created_at },
  }.freeze

  def index
    tickets = Ticket

    # Filter based on params
    type = params[:type]
    if type
      tickets = tickets.where(metadata_type: type)
    end

    status = params[:status]
    tickets = tickets.select do |ticket|
      if status
        ticket.metadata&.status == status
      else
        true
      end
    end

    # Filter based on current_user's permission
    tickets = tickets.select do |ticket|
      ticket.can_user_access?(current_user)
    end

    # Sort
    sort_param = params[:sort] || ''
    tickets = sort(tickets, sort_param, SORT_WEIGHT_LAMBDAS)

    # paginate won't help in improving efficiency here because we are fetching all the tickets
    # and then filtering and sorting them. We can't use the database to do this because the
    # filtering and sorting is based on the metadata of the ticket.
    # TODO: Check the feasibility of using the database to filter and sort the tickets.
    paginate json: tickets
  end

  def show
    respond_to do |format|
      format.html do
        @ticket_id = params.require(:id)
        render :show
      end
      format.json do
        ticket = Ticket.find(params.require(:id))

        # Currently only stakeholders can access the ticket.
        return head :unauthorized unless ticket.can_user_access?(current_user)

        render json: {
          ticket: ticket,
          requester_stakeholders: ticket.user_stakeholders(current_user),
        }
      end
    end
  end

  def update_status
    ticket = Ticket.find(params.require(:ticket_id))
    ticket_status = params.require(:ticket_status)
    acting_stakeholder_id = params.require(:acting_stakeholder_id)

    return head :unauthorized unless ticket.action_allowed?(:update_status, current_user)
    return head :bad_request unless ticket.user_stakeholders(current_user).map(&:id).include?(acting_stakeholder_id)

    ActiveRecord::Base.transaction do
      ticket.metadata.update!(status: ticket_status)
      TicketLog.create!(
        ticket_id: ticket.id,
        action_type: TicketLog.action_types[:status_updated],
        action_value: ticket_status,
        acting_user_id: current_user.id,
        acting_stakeholder_id: acting_stakeholder_id,
      )
    end
    render json: { success: true }
  end

  def edit_person_validators
    ticket = Ticket.find(params.require(:ticket_id))
    name_validation_issues = []
    dob_validation_issues = []

    ticket.metadata.tickets_edit_person_fields.each do |edit_person_field|
      case edit_person_field[:field_name]
      when TicketsEditPersonField.field_names[:name]
        name_to_validate = edit_person_field[:new_value]
        name_validation_issues = ResultsValidators::PersonsValidator.name_validations(name_to_validate, nil)
      when TicketsEditPersonField.field_names[:dob]
        dob_to_validate = Date.parse(edit_person_field[:new_value])
        dob_validation_issues = ResultsValidators::PersonsValidator.dob_validations(dob_to_validate, nil, name: ticket.metadata.wca_id)
      end
    end

    render json: {
      name: name_validation_issues,
      dob: dob_validation_issues,
    }
  end

  private def get_user_and_person
    user_id = params[:userId]
    wca_id = params[:wcaId]

    if user_id && !wca_id
      user = User.find(user_id)
      person = user.person
    elsif !user_id && wca_id
      person = Person.find_by(wca_id: wca_id)
      user = person.user
    elsif user_id && wca_id
      person = Person.find_by(wca_id: wca_id)
      user = User.find(user_id)
    end
    [user, person]
  end

  private def check_errors(user, person)
    if user.present? && person.present? && person&.user != user
      render status: :unprocessable_entity, json: {
        error: "Person and user not linked.",
      }
      return true
    end

    if user.nil? && person.nil?
      render status: :unprocessable_entity, json: {
        error: "User ID and WCA ID is not provided.",
      }
      return true
    end
    false
  end

  def details_before_anonymization
    user, person = get_user_and_person
    return if check_errors(user, person)

    anonymization_checks = {}
    message_args = {}
    action_items = []
    non_action_items = []

    # 1. Check whether the user is currently banned or not.
    anonymization_checks[:user_currently_banned] = user&.banned?

    # 2. Check whether the user was banned in the past.
    anonymization_checks[:user_banned_in_past] = user&.banned_in_past?

    # 3. Check whether the person has held any records in the past.
    records = person&.records
    anonymization_checks[:person_has_records_in_past] = records.present? && records[:total] > 0
    message_args[:records] = records

    # 4. Check whether the person had podium on national championships.
    championship_podiums = person&.championship_podiums
    anonymization_checks[:person_held_championship_podiums] = championship_podiums&.values_at(:world, :continental, :national)&.any?(&:present?)
    message_args[:championship_podiums] = championship_podiums

    # 5. Check whether the person has competed in last 3 months.
    recent_competitions_3_months = person&.competitions&.select { |c| c.start_date > (Date.today - 3.month) }
    anonymization_checks[:person_competed_in_last_3_months] = recent_competitions_3_months&.any?
    message_args[:recent_competitions_3_months] = recent_competitions_3_months

    # 6. Check whether the user has account in WCA Forum.
    anonymization_checks[:user_may_have_forum_account] = user.present?

    # 7. Check whether the user has any active OAuth access grants.
    access_grants = user&.oauth_access_grants&.select { |access_grant| !access_grant.revoked_at.nil? }
    anonymization_checks[:user_has_active_oauth_access_grants] = access_grants&.any?
    message_args[:access_grants] = access_grants

    # 8. Check whether there are any competitions with external websites.
    competitions_with_external_website = person&.competitions&.select { |c| c.external_website.present? }
    anonymization_checks[:competitions_with_external_website] = competitions_with_external_website&.any?
    message_args[:competitions_with_external_website] = competitions_with_external_website

    # 9. Check whether there are any recent competitions data to be removed from WCA Live.
    anonymization_checks[:recent_competitions_data_to_be_removed_wca_live] = recent_competitions_3_months&.any?

    anonymization_checks.each { |key, value| (value ? action_items : non_action_items) << key }

    render json: {
      user: user,
      person: person,
      action_items: action_items,
      non_action_items: non_action_items,
      message_args: message_args,
    }
  end

  def anonymize
    user, person = get_user_and_person
    return if check_errors(user, person)

    if user&.banned?
      return render status: :unprocessable_entity, json: {
        error: "Error anonymizing: This person is currently banned and cannot be anonymized.",
      }
    end

    if person.present?
      wca_id_year = person.wca_id[0..3]
      semi_id, = FinishUnfinishedPersons.compute_semi_id(wca_id_year, User::ANONYMOUS_NAME)
      new_wca_id, = FinishUnfinishedPersons.complete_wca_id(semi_id)

      if new_wca_id.nil?
        return render status: :internal_server_error, json: {
          error: "Error generating new WCA ID",
        }
      end
    end

    if user.present? && person.present?
      users_to_anonymize = User.where(id: user.id).or(User.where(unconfirmed_wca_id: person.wca_id))
    elsif user.present? && person.nil?
      users_to_anonymize = User.where(id: user.id)
    elsif user.nil? && person.present?
      users_to_anonymize = User.where(unconfirmed_wca_id: person.wca_id)
    end

    ActiveRecord::Base.transaction do
      if person.present?
        # Anonymize person's data in Results
        person.results.update_all(personId: new_wca_id, personName: User::ANONYMOUS_NAME)

        # Anonymize person's data in Persons
        if person.sub_ids.length > 1
          # if an updated person is due to a name change, this will delete the previous person.
          # if an updated person is due to a country change, this will keep the sub person with an appropriate subId
          previous_persons = Person.where(wca_id: wca_id).where.not(subId: 1).order(:subId)
          current_sub_id = 1
          current_country_id = person.countryId

          previous_persons.each do |p|
            if p.countryId == current_country_id
              p.delete
            else
              current_sub_id += 1
              current_country_id = p.countryId
              p.update(
                wca_id: new_wca_id,
                name: User::ANONYMOUS_NAME,
                gender: User::ANONYMOUS_GENDER,
                dob: User::ANONYMOUS_DOB,
                subId: current_sub_id,
              )
            end
          end
        end
        # Anonymize person's data in Persons for subid 1
        person.update(
          wca_id: new_wca_id,
          name: User::ANONYMOUS_NAME,
          gender: User::ANONYMOUS_GENDER,
          dob: User::ANONYMOUS_DOB,
        )
      end

      users_to_anonymize.each do |user_to_anonymize|
        user_to_anonymize.skip_reconfirmation!
        user_to_anonymize.update(
          email: user_to_anonymize.id.to_s + User::ANONYMOUS_ACCOUNT_EMAIL_ID_SUFFIX,
          name: User::ANONYMOUS_NAME,
          unconfirmed_wca_id: nil,
          delegate_id_to_handle_wca_id_claim: nil,
          dob: User::ANONYMOUS_DOB,
          gender: User::ANONYMOUS_GENDER,
          current_sign_in_ip: nil,
          last_sign_in_ip: nil,
          # If the account associated with the WCA ID is a special account (delegate, organizer,
          # team member) then we want to keep the link between the Person and the account.
          wca_id: user&.is_special_account? ? new_wca_id : nil,
          current_avatar_id: user&.is_special_account? ? nil : user_to_anonymize.current_avatar_id,
          country_iso2: user&.is_special_account? ? user_to_anonymize.country_iso2 : nil,
        )
      end
    end

    render json: {
      success: true,
      new_wca_id: new_wca_id,
    }
  end
end
