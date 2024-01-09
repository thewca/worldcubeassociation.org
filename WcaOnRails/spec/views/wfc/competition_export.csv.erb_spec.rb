# frozen_string_literal: true

require "csv"
require "rails_helper"

RSpec.describe "wfc/competition_export.csv.erb" do
  register_parser :csv, ->(rendered) { CSV.parse(rendered, col_sep: "\t") }
  register_parser :csv_header, ->(rendered) { CSV.parse(rendered, headers: true, col_sep: "\t") }

  it "renders valid csv headers" do
    expected_headers = [
      "Id", "Name", "Country", "Continent",
      "Start", "End", "Announced", "Posted",
      "Link on WCA", "Competitors", "Delegates",
      "Currency Code", "Base Registration Fee", "Currency Subunit",
      "Championship Type", "Exempt from WCA Dues", "Organizers",
      "Calculated Dues", "Dues Payer Name", "Dues Payer Email",
      "Is Combined Invoice", "Dues Band"
    ]

    assign(:competitions, [])
    render

    headers = rendered.csv[0]
    expect(headers).to eq expected_headers
  end

  it "filters out trainee delegates" do
    competition = FactoryBot.create :competition, :with_valid_submitted_results, :with_delegates_and_trainee_delegate
    competition.define_singleton_method(:num_competitors) do # mock count(distinct ...) from controller
      10
    end

    assign(:competitions, [competition])
    render

    delegates_without_trainees = competition.delegates.reject(&:trainee_delegate?)
    expect(delegates_without_trainees.length).to_not eq competition.delegates.length

    table = rendered.csv_header
    expect(table[0]["Delegates"]).to eq delegates_without_trainees.map(&:name).sort.join(",")
  end
end
