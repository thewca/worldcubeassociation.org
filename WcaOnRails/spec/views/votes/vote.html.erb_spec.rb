# frozen_string_literal: true

require "rails_helper"

RSpec.describe "votes/vote" do
  it "smoke test" do
    poll = FactoryGirl.create :poll, :confirmed, comment: nil
    vote = Vote.new

    assign(:poll, poll)
    assign(:vote, vote)

    render
  end
end
