# frozen_string_literal: true

require 'rails_helper'
require 'auxiliary_data_computation'

RSpec.describe "AuxiliaryDataComputation" do
  describe ".compute_concise_results", :clean_db_with_truncation do
    let(:person) { create(:person, country_id: "China") }
    let(:competition_2016) { create(:competition, starts: Date.parse("2016-04-04")) }
    let(:next_competition_2016) { create(:competition, starts: Date.parse("2016-07-07")) }
    let(:competition_2017) { create(:competition, starts: Date.parse("2017-08-08")) }

    it "creates tables containing best results data for each person per event per year" do
      round_333 = create(:round, competition: competition_2016, total_number_of_rounds: 2)
      round_333_f = create(:round, competition: competition_2016, total_number_of_rounds: 2, number: 2)
      create(:result, event_id: "333", best: 750, average: 800, competition: competition_2016, person: person, round_type_id: "1", round: round_333)
      create(:result, event_id: "333", best: 700, average: 850, competition: competition_2016, person: person, round_type_id: "f", round: round_333_f)
      create(:result, event_id: "333", best: 800, average: 900, competition: competition_2017, person: person)
      create(:result, event_id: "222", best: 100, average: 150, competition: competition_2017, person: person)
      AuxiliaryDataComputation.compute_everything
      # Concise single results
      concise_single_results = ActiveRecord::Base.connection.execute "SELECT event_id, person_id, reg_year, best FROM concise_single_results"
      expect(concise_single_results).to contain_exactly(["333", person.wca_id, 2016, 700], ["333", person.wca_id, 2017, 800], ["222", person.wca_id, 2017, 100])
      # Concise average results
      concise_average_results = ActiveRecord::Base.connection.execute "SELECT event_id, person_id, reg_year, average FROM concise_average_results"
      expect(concise_average_results).to contain_exactly(["333", person.wca_id, 2016, 800], ["333", person.wca_id, 2017, 900], ["222", person.wca_id, 2017, 150])
    end

    it "creates multiple entries for people that have switched country in the middle of a year" do
      create(:result, event_id: "333", best: 700, average: 800, competition: competition_2016, person: person)
      person.update_using_sub_id! country_id: "Chile"
      create(:result, event_id: "333", best: 750, average: 850, competition: next_competition_2016, person: person)
      AuxiliaryDataComputation.compute_everything
      # Concise single results
      concise_single_results = ActiveRecord::Base.connection.execute "SELECT event_id, person_id, country_id, reg_year, best FROM concise_single_results"
      expect(concise_single_results).to contain_exactly(["333", person.wca_id, "China", 2016, 700], ["333", person.wca_id, "Chile", 2016, 750])
      # Concise average results
      concise_average_results = ActiveRecord::Base.connection.execute "SELECT event_id, person_id, country_id, reg_year, average FROM concise_average_results"
      expect(concise_average_results).to contain_exactly(["333", person.wca_id, "China", 2016, 800], ["333", person.wca_id, "Chile", 2016, 850])
    end
  end

  describe ".compute_rank_tables", :clean_db_with_truncation do
    let(:australian) { create(:person, country_id: "Australia") }
    let(:canadian) { create(:person, country_id: "Canada") }
    let(:american_1) { create(:person, country_id: "USA") }
    let(:american_2) { create(:person, country_id: "USA") }

    def rank_333(person, ranks_type)
      person.public_send(ranks_type).find_by(event_id: "333").attributes.symbolize_keys
    end

    before do
      create(:result, event_id: "333", best: 600, average: 700, person: australian)
      create(:result, event_id: "333", best: 700, average: 800, person: american_1)
      create(:result, event_id: "333", best: 800, average: 900, person: canadian)
      create(:result, event_id: "333", best: 900, average: 1000, person: american_2)
    end

    it "computes world, continental, and national ranking position" do
      AuxiliaryDataComputation.compute_everything
      %w[ranks_single ranks_average].each do |ranks_type|
        expect(rank_333(australian, ranks_type)).to include(world_rank: 1, continent_rank: 1, country_rank: 1)
        expect(rank_333(american_1, ranks_type)).to include(world_rank: 2, continent_rank: 1, country_rank: 1)
        expect(rank_333(canadian, ranks_type)).to include(world_rank: 3, continent_rank: 2, country_rank: 1)
        expect(rank_333(american_2, ranks_type)).to include(world_rank: 4, continent_rank: 3, country_rank: 2)
      end
    end

    it "when a person changes country results from the previous region doesn't apply to the current one" do
      american_1.update_using_sub_id! country_id: "Canada"
      new_canadian = american_1
      australian.update_using_sub_id! country_id: "France"
      new_french = australian
      create(:result, event_id: "333", best: 900, average: 1000, person: new_canadian)
      AuxiliaryDataComputation.compute_everything
      %w[ranks_single ranks_average].each do |ranks_type|
        # NOTE: this person hasn't got any results in Europe/France yet.
        expect(rank_333(new_french, ranks_type)).to include(world_rank: 1, continent_rank: 0, country_rank: 0)
        # NOTE: the only change is the country_rank of new_canadian (previously american_1).
        # Note: the continent is still USA, so continent_rank shouldn't be affected.
        expect(rank_333(new_canadian, ranks_type)).to include(world_rank: 2, continent_rank: 1, country_rank: 2)
        expect(rank_333(canadian, ranks_type)).to include(world_rank: 3, continent_rank: 2, country_rank: 1)
        # NOTE: this person stays 2nd in the country.
        expect(rank_333(american_2, ranks_type)).to include(world_rank: 4, continent_rank: 3, country_rank: 2)
      end
    end
  end
end
