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

    private def new_id_params
      params.permit(:name, :competition_id, :semi_id)
    end

    private def person_params
      params.require(:person).permit(:name, :wca_id, :dob, :gender, :countryId)
    end
  end
end
