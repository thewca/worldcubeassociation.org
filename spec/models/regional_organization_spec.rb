# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RegionalOrganization, type: :model do
  it 'has a valid factory' do
    expect(FactoryBot.create(:regional_organization)).to be_valid
  end
end
