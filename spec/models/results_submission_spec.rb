# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ResultsSubmission do
  let(:results_submission) { FactoryBot.build(:results_submission) }

  it 'is defines a valid factory' do
    expect(results_submission).to be_valid
  end

  it 'requires message' do
    results_submission.message = nil
    expect(results_submission).to be_invalid_with_errors(message: ["can't be blank"])
  end

  it 'requires confirmation' do
    results_submission.confirm_information = nil
    expect(results_submission).to be_invalid_with_errors(confirm_information: [ResultsSubmission::CONFIRM_INFORMATION_ERROR])
  end

  it 'requires schedule url looks like a url' do
    results_submission.schedule_url = nil
    expect(results_submission).to be_invalid_with_errors(schedule_url: ["can't be blank"])

    results_submission.schedule_url = 'i am clearly not a url'
    expect(results_submission).to be_invalid_with_errors(schedule_url: ['must be a valid url starting with http:// or https://'])
  end
end
