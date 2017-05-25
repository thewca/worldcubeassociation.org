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

  it 'can post results for a competition' do
    expect(Post.count).to eq 0

    get competition_post_results_path(competition)

    expect(Post.count).to eq 1

    # Attempt to post results for a competition that already has results posted.
    get competition_post_results_path(competition)

    expect(Post.count).to eq 1
  end
end
