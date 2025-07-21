# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RegistrationPayment do
  describe '#amount_available_for_refund' do
    it 'returns 10 when no refund' do
    end

    it 'returns 5 when partially refunded' do
    end

    it 'returns 0 when fully refunded' do
    end
  end
end

