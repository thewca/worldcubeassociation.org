# frozen_string_literal: true
require "rails_helper"

RSpec.describe "competitions" do
  sign_in { FactoryGirl.create :admin }

  let(:competition) { FactoryGirl.create(:competition, :with_delegate) }

  it 'can confirm competition' do
    patch_via_redirect competition_path(competition), {
      'competition[name]' => competition.name,
      'competition[delegate_ids]' => competition.delegate_ids,
      'commit' => 'Confirm',
    }
    expect(response).to be_success

    expect(competition.reload.isConfirmed?).to eq true
  end
end
