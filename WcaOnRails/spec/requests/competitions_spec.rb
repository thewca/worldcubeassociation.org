require "rails_helper"

describe "competitions" do
  sign_in { FactoryGirl.create :admin }

  let(:competition) { FactoryGirl.create(:competition_with_delegates) }

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
