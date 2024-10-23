# frozen_string_literal: true

class PanelWfcEquipmentsController < ApplicationController
  before_action -> { redirect_to_root_unless_user(:has_permission?, 'can_access_panels', :wfc) }, only: [:index]

  def index
    render json: WfcEquipment.all
  end

  def create
    wfc_equipment = WfcEquipment.new(
      name: params[:name],
      description: params[:description],
      price_in_usd: params[:price_in_usd],
      brand: params[:brand],
      in_stock_for_purchase: params[:in_stock_for_purchase],
    )
    if wfc_equipment.save
      render json: wfc_equipment, status: :created
    else
      render json: wfc_equipment.errors, status: :unprocessable_entity
    end
  end
end
