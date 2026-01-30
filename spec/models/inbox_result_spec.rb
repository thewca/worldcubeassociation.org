# frozen_string_literal: true

require 'rails_helper'

RSpec.describe InboxResult do
  it "returns the correct person name" do
    c1 = create(:competition)
    c2 = create(:competition)
    create(:inbox_person, competition_id: c1.id, ref_id: "1")
    p2 = create(:inbox_person, competition_id: c2.id, ref_id: "1")
    result = create(:inbox_result, person: p2, competition: c2)
    expect(result.person_name).to eq p2.name
  end
end
