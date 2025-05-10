# frozen_string_literal: true

class Api::ApiController < ApplicationController
  def route_not_found
    render json: {
      error: 'API endpoint not implemented',
    }, status: :not_implemented
  end
end

