# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Poll do
  it 'has a valid factory' do
    expect(FactoryBot.create(:poll)).to be_valid
  end

  describe 'confirming a poll' do
    it 'can confirm a poll' do
      poll = FactoryBot.create :poll
      FactoryBot.create(:poll_option, poll_id: poll.id)
      FactoryBot.create(:poll_option, poll_id: poll.id)
      poll.confirmed_at = Time.now
      expect(poll).to be_valid
    end

    it 'requires two options' do
      poll = FactoryBot.create :poll
      poll.confirmed_at = Time.now
      expect(poll).to be_invalid_with_errors(poll_options: ['Poll must have at least two options'])

      FactoryBot.create(:poll_option, poll_id: poll.id)
      FactoryBot.create(:poll_option, poll_id: poll.id)
      poll.poll_options.reload
      expect(poll).to be_valid

      poll.poll_options[0].mark_for_destruction
      expect(poll).to be_invalid_with_errors(poll_options: ['Poll must have at least two options'])
    end

    it 'testing deadline bug' do
      # Skipping validation because can't create poll with past deadline.
      poll = FactoryBot.build(:poll, deadline: Date.new(2014, 2, 11))
      poll.save!(validate: false)
      poll.comment = 'Hey Jeremy'
      poll.save!(validate: false)
      poll.reload
      expect(poll.deadline).to eq Date.new(2014, 2, 11)
    end
  end
end
