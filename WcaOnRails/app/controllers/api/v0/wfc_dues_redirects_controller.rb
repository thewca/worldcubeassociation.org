# frozen_string_literal: true

class Api::V0::WfcDuesRedirectsController < Api::V0::ApiController
  before_action :current_user_can_admin_finances!, only: [:index, :create]
  private def current_user_can_admin_finances!
    unless current_user.can_admin_finances?
      render json: {}, status: 401
    end
  end

  def index
    render json: WfcDuesRedirect.all
  end

  def create
    redirect_type = params.require(:redirectType)
    if redirect_type == WfcDuesRedirect.redirect_types[:country]
      redirect_from_country_iso2 = params.require(:redirectFromCountryIso2)
      redirect_from_country_id = Country.find_by_iso2(redirect_from_country_iso2).id
    elsif redirect_type == WfcDuesRedirect.redirect_types[:organizer]
      redirect_from_organizer_id = params.require(:redirectFromOrganizerId)
    else
      raise "Unknown redirect type: #{redirect_type}"
    end
    redirect_to_id = params.require(:redirectToId)
    wfc_dues_redirect = WfcDuesRedirect.new(redirect_type: redirect_type, redirect_from_country_id: redirect_from_country_id, redirect_from_organizer_id: redirect_from_organizer_id, redirect_to_id: redirect_to_id)
    if wfc_dues_redirect.save
      render json: wfc_dues_redirect, status: :created
    else
      render json: wfc_dues_redirect.errors, status: :unprocessable_entity
    end
  end
end
