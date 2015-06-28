class RegistrationsController < ApplicationController
  # TODO - copied from CompetitionsController, pull into a superclass?
  before_action :authenticate_user!
  # TODO - change so organizers/delegates can access their own comps as well
  before_action :can_admin_results_only

  def index
    @competition = Competition.find(params[:id])
  end

  def update
    @registration = Registration.find(params[:id])
    if @registration.update_attributes(registration_params)
      redirect_to registrations_path @registration.competition
    else
      # TODO - what to do on failure? #<<<
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
