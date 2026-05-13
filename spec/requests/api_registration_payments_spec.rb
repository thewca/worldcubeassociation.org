# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API Registration Payments' do
  describe 'GET #show' do
    let!(:competition) { create(:competition, :stripe_connected) }
    let(:reg) { create(:registration, competition: competition) }
    let!(:registration_payment) { create(:registration_payment, registration: reg) }

    it 'returns an unrefunded registration payment' do
      api_sign_in_as(reg.user)
      get api_v1_registration_payments_path(reg), as: :json
      expect(response).to have_http_status(:ok)
    end

    it 'charge has 1000 amount refundable' do
      api_sign_in_as(reg.user)
      get api_v1_registration_payments_path(reg), as: :json

      charge = response.parsed_body['charges'].first
      expect(charge['iso_amount_refundable']).to eq(1000)
    end

    it 'returns 500 amount refundable with partial refund' do
      api_sign_in_as(reg.user)
      create(:registration_payment, :refund, registration: reg, amount_lowest_denomination: -500)
      get api_v1_registration_payments_path(reg), as: :json

      charge = response.parsed_body['charges'].first
      expect(charge['iso_amount_refundable']).to eq(500)
    end

    it 'returns 0 amount refundable with full refund' do
      api_sign_in_as(reg.user)
      create(:registration_payment, :refund, registration: reg)
      get api_v1_registration_payments_path(reg), as: :json

      charge = response.parsed_body['charges'].first
      expect(charge['iso_amount_refundable']).to eq(0)
    end
  end
end
