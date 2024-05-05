# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Incident do
  it "has a valid factory" do
    expect(FactoryBot.create(:incident)).to be_valid
  end

  it "creates a valid sent incident" do
    expect(FactoryBot.create(:sent_incident)).to be_valid
  end

  it "creates default tags" do
    incident = FactoryBot.create(:incident)
    expect(incident.incident_tags.size).to eq 1
  end

  it "creates custom tags" do
    tags = ["one", "two"]
    incident = FactoryBot.create(:incident, tags: tags)
    expect(incident.incident_tags.map(&:tag)).to eq tags
  end

  it "creates default comp" do
    incident = FactoryBot.create(:incident, :with_comp)
    expect(incident.competitions.size).to eq 1
  end

  it "associates to competitions" do
    comp = [FactoryBot.create(:competition), "see number 1"]
    comp2 = [FactoryBot.create(:competition), "not in the report"]
    incident = FactoryBot.create(:incident, comps: [comp, comp2])
    expect(incident.competitions.size).to eq 2
    expect(incident.incident_competitions.map(&:comments)).to match_array [comp[1], comp2[1]]
  end
end
