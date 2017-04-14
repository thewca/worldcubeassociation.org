# frozen_string_literal: true

require "rails_helper"

RSpec.describe "competitions" do
  sign_in { FactoryGirl.create :admin }

  let(:competition) { FactoryGirl.create(:competition, :with_delegate) }

  it 'can confirm competition' do
    patch competition_path(competition), params: {
      'competition[name]' => competition.name,
      'competition[delegate_ids]' => competition.delegate_ids,
      'commit' => 'Confirm',
    }
    follow_redirect!
    expect(response).to be_success

    expect(competition.reload.isConfirmed?).to eq true
  end
end
