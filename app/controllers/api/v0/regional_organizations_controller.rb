# frozen_string_literal: true

class Api::V0::RegionalOrganizationsController < ApplicationController
  def index
    render json: RegionalOrganization.includes(:logo_attachment)
                                     .currently_acknowledged
                                     .order(country: :asc)
                                     .as_json(methods: %w[logo_url country_iso2])
  end
end
