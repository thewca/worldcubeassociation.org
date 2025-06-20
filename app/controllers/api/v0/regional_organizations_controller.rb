# frozen_string_literal: true

class Api::V0::RegionalOrganizationsController < ApplicationController
  def index
    render json: RegionalOrganization.currently_acknowledged.order(country: :asc)
  end
end
