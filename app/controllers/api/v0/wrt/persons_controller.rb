# frozen_string_literal: true

class Api::V0::Wrt::PersonsController < Api::V0::ApiController
  before_action :current_user_can_admin_results!
  private def current_user_can_admin_results!
    unless current_user.can_admin_results?
      render json: {}, status: 401
    end
  end

  private def edit_params_from_person_params(person_params)
    name = person_params.require(:name)
    representing = person_params.require(:representing)
    gender = person_params.require(:gender)
    dob = person_params.require(:dob)
    country_id = Country.find_by_iso2(representing).id

    {
      name: name,
      countryId: country_id,
      gender: gender,
      dob: dob,
      incorrect_wca_id_claim_count: 0,
    }
  end

  def update
    wca_id = params.require(:id)
    person = Person.current.find_by(wca_id: wca_id)
    person_params = params.require(:person)

    if person.nil?
      render status: :unprocessable_entity, json: { error: "Person with WCA ID #{wca_id} not found." }
      return
    end

    edit_params = edit_params_from_person_params(person_params)

    if params[:method] == "fix"
      if person.update(edit_params)
        render status: :ok, json: { success: "Successfully fixed #{person.name}." }
      else
        render status: :unprocessable_entity, json: { error: "Error while fixing #{person.name}." }
      end
    elsif params[:method] == "update"
      if person.update_using_sub_id(edit_params)
        render status: :ok, json: { success: "Successfully updated #{person.name}." }
      else
        render status: :unprocessable_entity, json: { error: "Error while updating #{person.name}." }
      end
    else
      render status: :unprocessable_entity, json: { error: "Unknown method #{params[:method]}." }
    end
  end

  def destroy
    wca_id = params.require(:id)
    person = Person.current.find_by(wca_id: wca_id)

    if person.nil?
      render status: :unprocessable_entity, json: { error: "Person with WCA ID #{wca_id} not found." }
      return
    end

    if person.results.any?
      render status: :unprocessable_entity, json: { error: "#{person.name} has results, can't destroy them." }
    elsif person.user.present?
      render status: :unprocessable_entity, json: { error: "#{person.wca_id} is linked to a user, can't destroy them." }
    else
      name = person.name
      person.destroy
      render status: :ok, json: { success: "Successfully destroyed #{name}." }
    end
  end

  def reset_claim_count
    wca_id = params.require(:person_id)
    person = Person.current.find_by(wca_id: wca_id)

    if person.nil?
      render status: :unprocessable_entity, json: { error: "Person with WCA ID #{wca_id} not found." }
      return
    end

    person.update(incorrect_wca_id_claim_count: 0)
    render status: :ok, json: { success: "Successfully reset claim count for #{person.name}." }
  end
end
