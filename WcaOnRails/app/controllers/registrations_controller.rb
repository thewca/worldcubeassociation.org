class RegistrationsController < CompetitionsController
  skip_before_action :can_admin_results_only, only: [:index, :update_all]
  before_action :can_manage_competition_only, only: [:index, :update_all]

  def index
    @competition = Competition.find(params[:id])
    respond_to do |format|
      format.html
      format.csv do
        headers['Content-Disposition'] = "attachment; filename=\"#{@competition.id}-registration.csv\""
        headers['Content-Type'] ||= 'text/csv; charset=UTF-8'
      end
    end
  end

  def update_all
    @competition = Competition.find(params[:competition_id])
    ids = []
    registration_ids = params.select { |k| k.start_with?("registration-") }.map { |k, v| k.split('-')[1] }
    registrations = registration_ids.map do |registration_id|
      @competition.registrations.find_by_id!(registration_id)
    end
    case params[:registrations_action]
    when "accept-selected"
      registrations.each { |registration| registration.update_attribute(:status, "a") }
      flash[:success] = "Registrations approved!"
    when "reject-selected"
      registrations.each { |registration| registration.update_attribute(:status, "p") }
      flash[:warning] = "Registrations rejected"
    when "delete-selected"
      registrations.each { |registration| registration.delete }
      flash[:warning] = "Registrations deleted"
    else
      throw "Unrecognized action #{params[:registrations_action]}"
    end
    redirect_to registrations_path(@competition)
  end
end
