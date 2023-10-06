# frozen_string_literal: true

require_relative '../helpers/microservices_helper'
class UpdateWCARegistration < ApplicationJob
  def perform(status)
    token = get_wca_token
    response = httparty.post(update_payment_status_path, headers: { 'X-WCA-Service-Token' => token, "Content-Type" => "application/json" }, body: { payment_status: status }.to_json)
    unless response.ok?
      raise Error "Updating wca-registration failed with error #{response.status} #{response.body}"
    end
  end
end
