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
  end

end
