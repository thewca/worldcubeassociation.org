# frozen_string_literal: true

require 'rails_helper'

RSpec.describe InboxResult do
  it 'returns the correct person name' do
    c1 = FactoryBot.create(:competition)
    c2 = FactoryBot.create(:competition)
    FactoryBot.create(:inbox_person, competitionId: c1.id, id: '1')
    p2 = FactoryBot.create(:inbox_person, competitionId: c2.id, id: '1')
    result = FactoryBot.create(:inbox_result, person: p2, competition: c2)
    expect(result.personName).to eq p2.name
  end
end
