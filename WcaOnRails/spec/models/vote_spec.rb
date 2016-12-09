# frozen_string_literal: true
require 'rails_helper'

describe Vote do
  let(:poll) { FactoryGirl.create(:poll, :confirmed) }
  let(:delegate) { FactoryGirl.create(:delegate) }
  let(:vote) { FactoryGirl.create(:vote, user: delegate, poll: poll, poll_options: [ poll.poll_options.first ]) }

  it "is valid" do
    expect(vote).to be_valid
  end

  it "can't vote for nothing" do
    vote.poll_options = []
    expect(vote).to be_invalid
    expect(vote.errors[:poll_options]).to eq ["can't be empty"]
  end

  it "can't vote for multiple options on single-answer polls" do
    vote.poll_options = [ poll.poll_options[0], poll.poll_options[1] ]
    expect(vote).to be_invalid
    expect(vote.errors[:poll_options]).to eq ["you must choose just one option"]
  end

  it "can't vote for unconfirmed polls" do
    expect(vote).to be_valid
    poll.update_column(:confirmed_at, nil)
    expect(vote).to be_invalid
    expect(vote.errors[:poll_id]).to eq ["poll is not confirmed"]
  end

  it "can't vote for closed polls" do
    expect(vote).to be_valid
    poll.deadline = Time.now - 1.minute
    poll.save!
    expect(vote).to be_invalid
    expect(vote.errors[:poll_id]).to eq ["poll is closed"]
  end

  it "can't vote for a non-existent poll" do
    vote.poll_id = "hello"
    expect(vote).to be_invalid
    expect(vote.errors[:poll_id]).to eq ["is not valid"]
  end

  it "can't vote with a non-existent poll_option_id" do
    expect { vote.poll_option_ids = ["hello"] }.to raise_error(ActiveRecord::RecordNotFound)
  end

  it "can't vote with poll_option_id for different poll" do
    other_poll = FactoryGirl.create(:poll, :confirmed)
    vote.poll_option_ids = [ other_poll.poll_options.first.id ]
    expect(vote).to be_invalid
    expect(vote.errors[:poll_options]).to eq ["One or more poll_options don't match the poll"]
  end
end
