require 'rails_helper'

describe Poll do
  it "has a valid factory" do
    expect(FactoryGirl.create :poll).to be_valid
  end

  describe "confirming a poll" do
    it "can confirm a poll" do
      poll = FactoryGirl.create :poll
      FactoryGirl.create(:poll_option, poll_id: poll.id)
      FactoryGirl.create(:poll_option, poll_id: poll.id)
      poll.confirmed = true
      expect(poll).to be_valid
    end

    it "requires two options" do
      poll = FactoryGirl.create :poll
      poll.confirmed = true
      expect(poll).to be_invalid
      expect(poll.errors.keys).to eq [:poll_options]
    end

    it "testing deadline bug" do
      # Skipping validation because can't create poll with past deadline.
      poll = FactoryGirl.build(:poll, deadline: Date.new(2014, 02, 11))
      poll.save!(validate: false)
      ENV["pedro"] = poll.id.to_s
      poll.comment = "Hey Jeremy"
      debugger
      poll.save!(validate: false)
      poll.reload
      expect(poll.deadline).to eq Date.new(2014, 02, 11)
    end
  end

end
