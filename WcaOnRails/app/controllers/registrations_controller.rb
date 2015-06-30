class RegistrationsController < CompetitionsController
  def index
    @competition = Competition.find(params[:id])
  end

  def update
    @registration = Registration.find(params[:id])
    if @registration.update_attributes(registration_params)
      redirect_to registrations_path @registration.competition
    else
      # TODO - what to do on failure?
      redirect_to registrations_path @registration.competition
    end
  end

  private def registration_params
    params.require(:registration).permit(
      :personId,
      :name,
      :email,
      :countryId,
      :gender,
      :status,# TODO
      :birthday,# TODO
      :eventIds,# TODO
    )
  end
end
