# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ContactWct do
  context 'to email' do
    it 'sends inquires related to general WCA queries to the general WCA contact email' do
      form = FactoryBot.build(:contact_wct)
      expect(form.to_email).to eq 'contact@worldcubeassociation.org'
    end
  end

  context 'subject' do
    it 'builds subject line for general inquiry' do
      form = FactoryBot.build(:contact_wct)
      expect(form.subject).to start_with("[WCA Website] General Comment by #{form.name} on")
    end
  end
end
