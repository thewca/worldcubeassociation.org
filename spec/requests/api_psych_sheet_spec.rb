# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API competition psych sheets' do
  before do
    travel_to(Time.zone.local(2026, 11, 22))
    allow(Rails).to receive(:cache).and_return(ActiveSupport::Cache::MemoryStore.new)
    create(:ranks_single, person_id: alice.wca_id, event: event_id, best: 100, rank: 1)
    create(:ranks_average, person_id: alice.wca_id, event: event_id, best: 200, rank: 1)
    create(:ranks_single, person_id: bob.wca_id, event: event_id, best: 300, rank: 2)
    create(:ranks_average, person_id: bob.wca_id, event: event_id, best: 400, rank: 2)
  end

  let(:event_id) { '333' }
  let!(:competition) { create(:competition, :with_delegate, :visible, :future, event_ids: [event_id]) }
  let!(:alice) { create(:user, :wca_id, name: 'Alice') }
  let!(:bob) { create(:user, :wca_id, name: 'Bob') }
  let!(:newcomer) { create(:user, name: 'Newcomer') }
  let!(:alice_registration) { create(:registration, :accepted, competition: competition, user: alice, event_ids: [event_id]) }
  let!(:bob_registration) { create(:registration, :accepted, competition: competition, user: bob, event_ids: [event_id]) }
  let!(:newcomer_registration) { create(:registration, :accepted, competition: competition, user: newcomer, event_ids: [event_id]) }

  def result_for(user, date:, best:, average:, result_event_id: event_id, end_date: date)
    past_competition = create(:competition, starts: date, ends: end_date, event_ids: [result_event_id])
    if average.zero?
      create(:result, competition: past_competition, person: user.person, event_id: result_event_id, format_id: '1', best: best, average: average,
                      value2: 0, value3: 0, value4: 0, value5: 0)
    else
      remaining_attempt = best.negative? ? best : average
      create(:result, competition: past_competition, person: user.person, event_id: result_event_id, best: best, average: average,
                      value2: remaining_attempt, value3: remaining_attempt, value4: remaining_attempt, value5: remaining_attempt)
    end
  end

  def fetch_sheet(**params)
    get "/api/v0/competitions/#{competition.id}/psych-sheet/#{event_id}", params: params
    expect(response).to have_http_status(:ok)
    response.parsed_body
  end

  it 'defaults to lifetime personal bests and world ranks' do
    sheet = fetch_sheet

    expect(sheet['sort_by']).to eq('average')
    expect(sheet['sorted_rankings'].pluck('user_id')).to eq([alice.id, bob.id, newcomer.id])
    expect(sheet['sorted_rankings'].first).to include('single_best' => 100, 'average_best' => 200, 'single_rank' => 1, 'average_rank' => 1, 'pos' => 1)
    expect(sheet['sorted_rankings'].last).to include('single_best' => 0, 'average_best' => 0, 'pos' => nil)
    expect(fetch_sheet(ranking_period: 'all_time')).to eq(sheet)
  end

  it 'rejects unknown ranking periods' do
    get "/api/v0/competitions/#{competition.id}/psych-sheet/#{event_id}", params: { ranking_period: 'last_week' }

    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body['error']).to include('ranking_period')
  end

  it 'preserves all-time ties, secondary ordering and single sorting' do
    alice.ranks_average.find_by!(event_id: event_id).update!(best: 400, world_rank: 2)
    rows = fetch_sheet['sorted_rankings']
    expect(rows.pluck('user_id')).to eq([alice.id, bob.id, newcomer.id])
    expect(rows.pluck('pos')).to eq([1, 2, nil])

    alice.ranks_single.find_by!(event_id: event_id).update!(best: 300, world_rank: 2)
    Rails.cache.clear
    single_sheet = fetch_sheet(sort_by: 'single')
    expect(single_sheet['sort_by']).to eq('single')
    expect(single_sheet['sorted_rankings'].pluck('pos')).to eq([1, 1, nil])
    expect(single_sheet['sorted_rankings'][1]['tied_previous']).to be(true)
  end

  it 'uses competition end dates for competitions spanning the cutoff' do
    cutoff = Date.current - 12.months
    result_for(alice, date: cutoff - 1.day, end_date: cutoff, best: 700, average: 900)
    result_for(bob, date: Date.current, end_date: Date.current + 1.day, best: 500, average: 600)

    rows = fetch_sheet(ranking_period: 'last_12_months')['sorted_rankings']
    expect(rows.pluck('pos')).to eq([1, nil, nil])
    expect(rows.first).to include('user_id' => alice.id, 'single_best' => 700, 'average_best' => 900)
    expect(rows.find { |row| row['user_id'] == bob.id }['single_best']).to eq(0)
  end

  it 'uses twelve calendar months across a leap year' do
    travel_to(Time.zone.local(2024, 2, 29))
    result_for(alice, date: Date.new(2023, 2, 28), best: 700, average: 900)
    result_for(bob, date: Date.new(2023, 2, 27), best: 500, average: 600)

    rows = fetch_sheet(ranking_period: 'last_12_months')['sorted_rankings']
    expect(rows.pluck('pos')).to eq([1, nil, nil])
    expect(rows.first['user_id']).to eq(alice.id)
  end

  it 'returns an empty sheet if no accepted competitors entered the event' do
    competition.registrations.each { |registration| registration.update!(competing_status: Registrations::Helper::STATUS_PENDING) }

    expect(fetch_sheet(ranking_period: 'last_12_months')['sorted_rankings']).to be_empty
  end

  context 'with results from the last 12 months' do
    before do
      result_for(alice, date: Date.current - 5.years, best: 100, average: 200)
      result_for(alice, date: Date.current - 12.months, best: 900, average: 1200)
      result_for(alice, date: Date.current, best: 950, average: 1100)
      result_for(bob, date: Date.current - 12.months - 1.day, best: 300, average: 400)
      result_for(bob, date: Date.current - 1.day, best: 800, average: 1000)
      result_for(bob, date: Date.current + 1.day, best: 50, average: 60)
    end

    it 'uses an inclusive rolling date window and computes single and average separately' do
      rows = fetch_sheet(ranking_period: 'last_12_months')['sorted_rankings']

      expect(rows.pluck('user_id')).to eq([bob.id, alice.id, newcomer.id])
      expect(rows[0]).to include('single_best' => 800, 'average_best' => 1000, 'pos' => 1)
      expect(rows[1]).to include('single_best' => 900, 'average_best' => 1100, 'pos' => 2)
      expect(rows).to all(include('single_rank' => nil, 'average_rank' => nil))
    end

    it 'sorts by the selected result type within the selected period' do
      result_for(alice, date: Date.current - 2.days, best: 700, average: 1300)

      sheet = fetch_sheet(ranking_period: 'last_12_months', sort_by: 'single')

      expect(sheet['sort_by']).to eq('single')
      expect(sheet['sort_by_second']).to eq('average')
      expect(sheet['sorted_rankings'].pluck('user_id')).to eq([alice.id, bob.id, newcomer.id])
    end

    it 'breaks average ties by single, and only shares positions when both are tied' do
      result_for(alice, date: Date.current - 2.days, best: 850, average: 1000)
      rows = fetch_sheet(ranking_period: 'last_12_months')['sorted_rankings']
      expect(rows.pluck('pos')).to eq([1, 2, nil])
      expect(rows[1]['tied_previous']).to be(false)

      result_for(alice, date: Date.current - 3.days, best: 800, average: 1000)
      Rails.cache.clear
      tied_rows = fetch_sheet(ranking_period: 'last_12_months')['sorted_rankings']
      expect(tied_rows.pluck('user_id')).to eq([alice.id, bob.id, newcomer.id])
      expect(tied_rows.pluck('pos')).to eq([1, 1, nil])
      expect(tied_rows[1]['tied_previous']).to be(true)
    end

    it 'does not include results in another event or registrations that are not accepted' do
      result_for(alice, date: Date.current, best: 10, average: 20, result_event_id: '222')
      bob_registration.update!(competing_status: Registrations::Helper::STATUS_PENDING)

      rows = fetch_sheet(ranking_period: 'last_12_months')['sorted_rankings']

      expect(rows.pluck('user_id')).to eq([alice.id, newcomer.id])
      expect(rows.first).to include('single_best' => 900, 'average_best' => 1100)
    end

    it 'keeps period caches separate and advances the date window even without new rankings' do
      allow(ComputeAuxiliaryData).to receive(:end_date).and_return(Time.current)

      recent_rows = fetch_sheet(ranking_period: 'last_12_months')['sorted_rankings']
      expect(recent_rows.find { |row| row['user_id'] == alice.id }['single_best']).to eq(900)
      expect(fetch_sheet['sorted_rankings'].first['single_best']).to eq(100)

      travel 1.day

      next_day_rows = fetch_sheet(ranking_period: 'last_12_months')['sorted_rankings']
      expect(next_day_rows.find { |row| row['user_id'] == alice.id }['single_best']).to eq(950)
    end

    it 'updates cached positions when an accepted registration is removed' do
      expect(fetch_sheet(ranking_period: 'last_12_months')['sorted_rankings'].first['user_id']).to eq(bob.id)
      bob_registration.update!(competing_status: Registrations::Helper::STATUS_PENDING)

      rows = fetch_sheet(ranking_period: 'last_12_months')['sorted_rankings']
      expect(rows.pluck('user_id')).to eq([alice.id, newcomer.id])
      expect(rows.first['pos']).to eq(1)
    end
  end

  context 'without successful recent averages' do
    before do
      result_for(alice, date: Date.current - 2.years, best: 100, average: 200)
      result_for(alice, date: Date.current, best: -1, average: -1)
      dns_result = result_for(alice, date: Date.current - 1.day, best: -1, average: -1)
      dns_result.result_attempts.find_by!(attempt_number: 2).update!(value: -2)
      result_for(bob, date: Date.current, best: 800, average: -1)
      result_for(bob, date: Date.current - 1.day, best: 850, average: -1)
    end

    it 'keeps inactive competitors and newcomers, without falling back to lifetime results' do
      rows = fetch_sheet(ranking_period: 'last_12_months')['sorted_rankings']

      expect(rows.pluck('user_id')).to eq([bob.id, alice.id, newcomer.id])
      expect(rows.pluck('pos')).to eq([nil, nil, nil])
      expect(rows.pluck('average_best')).to eq([0, 0, 0])
      expect(rows.pluck('single_best')).to eq([800, 0, 0])
    end

    it 'ranks a successful single even without an average' do
      rows = fetch_sheet(ranking_period: 'last_12_months', sort_by: 'single')['sorted_rankings']

      expect(rows.pluck('pos')).to eq([1, nil, nil])
      expect(rows.first['single_best']).to eq(800)
    end
  end

  context 'for multi-blind' do
    let(:event_id) { '333mbf' }

    it 'defaults to single and compares encoded results' do
      result_for(alice, date: Date.current, best: 900_024_000, average: 0)
      result_for(bob, date: Date.current, best: 950_012_000, average: 0)

      sheet = fetch_sheet(ranking_period: 'last_12_months')

      expect(sheet['sort_by']).to eq('single')
      expect(sheet['sorted_rankings'].pluck('user_id')).to eq([alice.id, bob.id, newcomer.id])
      expect(sheet['sorted_rankings'].pluck('pos')).to eq([1, 2, nil])
    end
  end
end
