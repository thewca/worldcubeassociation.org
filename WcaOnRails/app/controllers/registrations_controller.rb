class RegistrationsController < ApplicationController
  # TODO - copied from CompetitionsController, pull into a superclass?
  before_action :authenticate_user!
  # TODO - change so delegate can access their own comps as well
  before_action :can_admin_results_only

  def index
    @competition = Competition.find(params[:id])
    # TODO - why can't we use @competition.registrations here?
    # something about per method in /usr/lib/ruby/gems/2.2.0/gems/wice_grid-3.4.14/lib/wice_grid.rb:320
    #@registrations_grid = initialize_grid(@competition.registrations, {
    @registrations_grid = initialize_grid(Registration, {
      order: 'name',
      order_direction: 'asc',
      conditions: ['competitionId = ?', @competition.id],
      custom_order: {
        # Dirty hack to sort properly with our bizarre date schema.
        # The right thing to do here is to migrate these into a single DATE field.
        'Preregs.birthYear' => lambda do |f|
          order_direction = @registrations_grid.status[:order_direction]
          "birthYear #{order_direction}, birthMonth #{order_direction}, birthDay"
        end
      }
    })
  end

  def update
  end
end
