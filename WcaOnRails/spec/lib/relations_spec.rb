# frozen_string_literal: true

require 'rails_helper'
require 'relations'

RSpec.describe "Relations" do
  before do
    Linking.create! [
      { wca_id: "2013KOSK01", wca_ids: %w(2005FLEI01 2008VIRO01) },
      { wca_id: "2005FLEI01", wca_ids: %w(2013KOSK01 2008VIRO01 1982PETR01) },
      { wca_id: "2008VIRO01", wca_ids: %w(2013KOSK01 2005FLEI01 1982PETR01) },
      { wca_id: "1982PETR01", wca_ids: %w(2005FLEI01 2008VIRO01) },
    ]
  end

  describe ".get_chain" do
    it "returns any of shortest valid chains linking two people" do
      chain = Relations.get_chain("2013KOSK01", "1982PETR01")
      expect([
        %w(2013KOSK01 2005FLEI01 1982PETR01),
        %w(2013KOSK01 2008VIRO01 1982PETR01),
      ].include?(chain)).to eq true
    end

    it "when there is no relation returns an empty array" do
      Linking.create! [
        { wca_id: "2017ELSE01", wca_ids: %w(2017ELSE02) },
        { wca_id: "2017ELSE02", wca_ids: %w(2017ELSE01) },
      ]
      chain = Relations.get_chain("2013KOSK01", "2017ELSE01")
      expect(chain).to eq []
    end
  end

  describe ".compute_linkings", clean_db_with_truncation: true do
    it "creates linkings by computing 1st degree relation for each person" do
      persons = FactoryGirl.create_list :person, 3
      competition = FactoryGirl.create :competition
      persons.each { |person| FactoryGirl.create :result, person: person, competition: competition }
      wca_id1, wca_id2, wca_id3 = persons.map(&:wca_id)

      Relations.compute_linkings

      expect(Linking.find_by_wca_id(wca_id1).wca_ids).to match_array [wca_id2, wca_id3]
      expect(Linking.find_by_wca_id(wca_id2).wca_ids).to match_array [wca_id1, wca_id3]
      expect(Linking.find_by_wca_id(wca_id3).wca_ids).to match_array [wca_id1, wca_id2]
    end
  end
end
