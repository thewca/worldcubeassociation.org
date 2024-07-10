# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'persons' do
  describe 'profile page' do
    let!(:person) { FactoryBot.create(:person_who_has_competed_once) }
    # Create person with account, so that there is the default avatar to display.
    let!(:user) { FactoryBot.create(:user, :wca_id, person: person) }

    it 'renders without error' do
      get person_path(person.wca_id)
      expect(response).to be_successful
    end
  end
end
