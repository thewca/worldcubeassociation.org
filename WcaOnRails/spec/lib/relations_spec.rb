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
  end

  describe ".extended_chains_by_one_degree!" do
    it "extends each chain by one degree" do
      # Degree: 0
      chains = [["2013KOSK01"]]
      # Degree: 1
      Relations.extended_chains_by_one_degree! chains
      expect(chains).to match_array [
        %w(2013KOSK01 2005FLEI01),
        %w(2013KOSK01 2008VIRO01),
      ]
      # Degree: 2
      Relations.extended_chains_by_one_degree! chains
      expect(chains).to match_array [
        %w(2013KOSK01 2005FLEI01 2013KOSK01),
        %w(2013KOSK01 2005FLEI01 2008VIRO01),
        %w(2013KOSK01 2005FLEI01 1982PETR01),

        %w(2013KOSK01 2008VIRO01 2013KOSK01),
        %w(2013KOSK01 2008VIRO01 2005FLEI01),
        %w(2013KOSK01 2008VIRO01 1982PETR01),
      ]
    end
  end

  describe ".random_final_chain" do
    it "finds a final chain linking two people from given arrays of partial chains" do
      final_chain = Relations.random_final_chain(
        [%w(2013KOSK01 2005FLEI01), %w(2013KOSK01 2011KNOT01)],
        [%w(1982PETR01 2003BRUC01), %w(1982PETR01 2005FLEI01)],
      )
      expect(final_chain).to eq %w(2013KOSK01 2005FLEI01 1982PETR01)
    end
  end

  describe ".compute_linkings" do
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
