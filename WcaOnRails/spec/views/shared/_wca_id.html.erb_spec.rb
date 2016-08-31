# frozen_string_literal: true
require "rails_helper"
require "capybara/rspec"

describe "shared/_wca_id.html.erb" do
  it "doesn't have extra whitespace" do
    render "shared/wca_id", wca_id: "2005FLEI01"
    expect(rendered).to eq '<span class="wca-id"><a href="http://test.host/results/p.php?i=2005FLEI01">2005FLEI01</a></span>'
  end
end
