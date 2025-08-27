# frozen_string_literal: true

module Admin
  class PersonsController < AdminController
    # NOTE: authentication is performed by admin controller

    def generate_ids
      competition = Competition.find(new_id_params[:competition_id])
      # If a valid semi_id is provided, just use it.
      semi_id = SemiId.new(value: new_id_params[:semi_id])
      # Else try generating one from params
      semi_id = SemiId.generate(new_id_params[:name], competition) if semi_id.value.blank?

      if semi_id.valid?
        # compute WCA ID
        wca_id = semi_id.generate_wca_id
        json = {
          semiId: semi_id.value,
          wcaId: wca_id,
        }
        json[:errors] = { wca_id: "could not generate a WCA ID for that semi, try another one" } if wca_id.blank?
        render json: json
      else
        render json: { errors: { semi_id: semi_id.errors[:value] } }
      end
    end

    def create
      p = Person.new(person_params)
      if p.save
        render json: p
      else
        render json: { errors: p.errors }
      end
    end

    def results
      person_wca_id = params.require(:wcaId)

      person = Person.current.find_by!(wca_id: person_wca_id)
      results_scope = person.results.joins(:competition).select('results.*, competitions.name AS competition_name')

      results_scope = results_scope.where(competition_id: params[:competitionId]) if params.key?(:competitionId)
      results_scope = results_scope.where(event_id: params[:eventId]) if params.key?(:eventId)

      render json: results_scope.as_json(
        only: %i[id competition_id competition_name],
        methods: %i[event_id person_name round_type_id],
      )
    end

    def registrations
      person_wca_id = params.require(:wcaId)

      person = Person.current.find_by!(wca_id: person_wca_id)
      registrations = person.user.registrations
                            .joins(:competition)
                            .merge(Competition.not_over)
                            .order(start_date: :asc)

      render json: registrations.as_json(
        only: %w[competing_status],
        include: {
          competition: {
            only: %w[id name city_name country_id start_date],
          },
        },
      )
    end

    def organized_competitions
      person_wca_id = params.require(:wcaId)

      person = Person.current.find_by!(wca_id: person_wca_id)
      competitions = person.user.organized_competitions
                           .over.visible.not_cancelled
                           .order(start_date: :desc)

      render json: competitions.as_json(
        only: %w[id name city_name country_id start_date],
      )
    end

    def delegated_competitions
      person_wca_id = params.require(:wcaId)

      person = Person.current.find_by!(wca_id: person_wca_id)
      competitions = person.user.delegated_competitions
                           .over.visible.not_cancelled
                           .order(start_date: :desc)

      render json: competitions.as_json(
        only: %w[id name city_name country_id start_date],
      )
    end

    private def new_id_params
      params.permit(:name, :competition_id, :semi_id)
    end

    private def person_params
      params.require(:person).permit(:name, :wca_id, :dob, :gender, :country_id)
    end
  end
end
