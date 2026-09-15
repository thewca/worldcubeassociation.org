# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API Registration Eligibility' do
  let(:competition) { create(:competition, :registration_open) }

  def eligibility_for(user)
    api_sign_in_as(user)
    get registration_eligibility_api_v1_competition_path(competition)
    expect(response).to have_http_status(:ok)
    response.parsed_body
  end

  it 'requires a signed in user' do
    get registration_eligibility_api_v1_competition_path(competition)
    expect(response).to have_http_status(:unauthorized)
  end

  it 'reports an ordinary user as eligible' do
    payload = eligibility_for(create(:user))

    expect(payload['banned']).to be false
    expect(payload['banned_until']).to be_nil
    expect(payload['missing_profile_fields']).to be_empty
    expect(payload['can_pre_register']).to be false
  end

  it 'lists the profile fields that are missing' do
    user = create(:user, country_iso2: nil)

    expect(eligibility_for(user)['missing_profile_fields']).to eq ['country_iso2']
  end

  it 'reports a permanently banned user as banned without an end date' do
    payload = eligibility_for(create(:user, :banned))

    expect(payload['banned']).to be true
    expect(payload['banned_until']).to be_nil
  end

  it 'reports when the ban ends if it ends before the competition' do
    user = create(:user, :briefly_banned)
    payload = eligibility_for(user)

    if user.banned_at_date?(competition.start_date)
      expect(payload['banned']).to be true
      expect(payload['banned_until']).to eq user.ban_end.to_s
    else
      # The ban lapses before the competition starts, so it does not block this registration.
      expect(payload['banned']).to be false
    end
  end

  it 'lets delegates and organizers pre-register' do
    competition = create(:competition, :registration_not_opened, :with_delegate)

    api_sign_in_as(competition.delegates.first)
    get registration_eligibility_api_v1_competition_path(competition)

    expect(response.parsed_body['can_pre_register']).to be true
  end

  it 'counts the competitors on the waiting list' do
    create_list(:registration, 2, :waiting_list, competition: competition)
    create(:registration, :accepted, competition: competition)

    expect(eligibility_for(create(:user))['waiting_list_count']).to eq 2
  end
end
