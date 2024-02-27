# frozen_string_literal: true

class Api::V0::Wfc::DuesRedirectsController < Api::V0::ApiController
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
    redirect_to_id = params.require(:redirectToId)
    if redirect_type == WfcDuesRedirect.redirect_source_types[:Country]
      redirect_from_country_iso2 = params.require(:redirectFromCountryIso2)
      redirect_source = Country.find_by_iso2(redirect_from_country_iso2)
    elsif redirect_type == WfcDuesRedirect.redirect_source_types[:User]
      redirect_from_organizer_id = params.require(:redirectFromOrganizerId)
      redirect_source = User.find(redirect_from_organizer_id)
    else
      raise "Unknown redirect type: #{redirect_type}"
    end
    wfc_dues_redirect = WfcDuesRedirect.new(redirect_source: redirect_source, redirect_to_id: redirect_to_id)
    if wfc_dues_redirect.save
      render json: wfc_dues_redirect, status: :created
    else
      render json: wfc_dues_redirect.errors, status: :unprocessable_entity
    end
  end

  def destroy
    id = params.require(:id)
    wfc_dues_redirect = WfcDuesRedirect.find(id)
    wfc_dues_redirect.destroy
    render json: wfc_dues_redirect
  end
end
