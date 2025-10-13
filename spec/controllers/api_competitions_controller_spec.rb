# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::V0::CompetitionsController do
  def get_wcif_and_compare_persons_to(id, expected)
    get :show_wcif, params: { competition_id: id }
    parsed_body = response.parsed_body
    person_arrays = parsed_body["persons"].map do |p|
      [p["wcaUserId"], p["registrantId"]]
    end
    expect(person_arrays).to eq expected
  end

  describe 'GET #show' do
    let(:competition) do
      create(
        :competition,
        :visible,
        id: "TestComp2014",
        start_date: "2014-02-03",
        end_date: "2014-02-05",
        external_website: "http://example.com",
      )
    end

    it '404s on invalid competition' do
      get :show, params: { id: "FakeId2014" }
      expect(response).to have_http_status :not_found
      parsed_body = response.parsed_body
      expect(parsed_body["error"]).to eq "Competition with id FakeId2014 not found"
    end

    it '404s on hidden competition' do
      competition.update_column(:show_at_all, false)
      get :show, params: { id: competition.id }
      expect(response).to have_http_status :not_found
      parsed_body = response.parsed_body
      expect(parsed_body["error"]).to eq "Competition with id #{competition.id} not found"
    end

    it 'finds competition' do
      get :show, params: { id: competition.id }
      expect(response).to have_http_status :ok
      parsed_body = response.parsed_body
      expect(parsed_body["id"]).to eq "TestComp2014"
      expect(parsed_body["start_date"]).to eq "2014-02-03"
      expect(parsed_body["end_date"]).to eq "2014-02-05"
      expect(parsed_body["website"]).to eq "http://example.com"
    end
  end

  describe 'GET #schedule' do
    let(:competition) do
      create(
        :competition,
        :with_delegate,
        :with_valid_schedule,
        :visible,
        id: "TestComp2014",
        start_date: "2014-02-03",
        end_date: "2014-02-05",
        external_website: "http://example.com",
      )
    end

    it '404s on invalid competition' do
      get :show, params: { id: "FakeId2014" }
      expect(response).to have_http_status :not_found
      parsed_body = response.parsed_body
      expect(parsed_body["error"]).to eq "Competition with id FakeId2014 not found"
    end

    it '404s on hidden competition' do
      competition.update_column(:show_at_all, false)
      get :show, params: { id: competition.id }
      expect(response).to have_http_status :not_found
      parsed_body = response.parsed_body
      expect(parsed_body["error"]).to eq "Competition with id #{competition.id} not found"
    end

    it 'displays schedule' do
      get :schedule, params: { competition_id: competition.id }
      expect(response).to have_http_status :ok
      parsed_body = response.parsed_body
      expect(parsed_body['startDate']).to eq '2014-02-03'
    end
  end

  describe 'GET #index' do
    it 'sorts newest to oldest' do
      yesteryear_comp = create(:competition, :confirmed, :visible, starts: 1.year.ago)
      yesterday_comp = create(:competition, :confirmed, :visible, starts: 1.day.ago)
      today_comp = create(:competition, :confirmed, :visible, starts: 0.days.ago)
      tomorrow_comp = create(:competition, :confirmed, :visible, starts: 1.day.from_now)

      get :index
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json.pluck("id")).to eq [tomorrow_comp, today_comp, yesterday_comp, yesteryear_comp].map(&:id)
    end

    it 'can query by country_iso2' do
      vietnam_comp = create(:competition, :confirmed, :visible, country_id: "Vietnam")
      usa_comp = create(:competition, :confirmed, :visible, country_id: "USA")

      get :index, params: { country_iso2: "US" }
      json = response.parsed_body
      expect(json.length).to eq 1
      expect(json[0]["id"]).to eq usa_comp.id

      get :index, params: { country_iso2: "VN" }
      json = response.parsed_body
      expect(json.length).to eq 1
      expect(json[0]["id"]).to eq vietnam_comp.id
    end

    context 'managed_by' do
      let(:delegate1) { create(:delegate) }
      let(:delegate2) { create(:delegate) }
      let(:trainee_delegate1) { create(:trainee_delegate) }
      let(:organizer1) { create(:user) }
      let(:organizer2) { create(:user) }
      let!(:competition) do
        create(:competition, :confirmed, delegates: [delegate1, delegate2, trainee_delegate1], organizers: [organizer1, organizer2])
      end
      let!(:other_comp) { create(:competition) }

      it 'managed_by includes delegate' do
        scopes = Doorkeeper::OAuth::Scopes.new
        scopes.add("manage_competitions")
        api_sign_in_as(delegate1, scopes: scopes)

        get :index, params: { managed_by_me: "true" }
        expect(response).to have_http_status :ok
        json = response.parsed_body
        expect(json.length).to eq 1
        expect(json[0]["id"]).to eq competition.id
      end

      it 'managed_by includes trainee delegate' do
        scopes = Doorkeeper::OAuth::Scopes.new
        scopes.add("manage_competitions")
        api_sign_in_as(trainee_delegate1, scopes: scopes)

        get :index, params: { managed_by_me: "true" }
        expect(response).to have_http_status :ok
        json = response.parsed_body
        expect(json.length).to eq 1
        expect(json[0]["id"]).to eq competition.id
      end

      it 'managed_by includes organizer' do
        scopes = Doorkeeper::OAuth::Scopes.new
        scopes.add("manage_competitions")
        api_sign_in_as(organizer1, scopes: scopes)

        get :index, params: { managed_by_me: "true" }
        expect(response).to have_http_status :ok
        json = response.parsed_body
        expect(json.length).to eq 1
        expect(json[0]["id"]).to eq competition.id
      end
    end

    it 'can do a plaintext query' do
      terrible_comp = create(:competition, :confirmed, :visible, name: "A terrible competition 2016", country_id: "USA")
      awesome_comp = create(:competition, :confirmed, :visible, name: "An awesome competition 2016", country_id: "France")

      get :index, params: { q: "AWES" }
      json = response.parsed_body
      expect(json.length).to eq 1
      expect(json[0]["id"]).to eq awesome_comp.id

      # Check that composing a plaintext query and a country query works.
      get :index, params: { q: "competition", country_iso2: "US" }
      json = response.parsed_body
      expect(json.length).to eq 1
      expect(json[0]["id"]).to eq terrible_comp.id
    end

    it 'validates start' do
      get :index, params: { start: "2015" }
      expect(response).to have_http_status :unprocessable_content
      json = response.parsed_body
      expect(json["error"]).to eq "Invalid start: '2015'"
    end

    it 'validates end' do
      get :index, params: { end: "2014" }
      expect(response).to have_http_status :unprocessable_content
      json = response.parsed_body
      expect(json["error"]).to eq "Invalid end: '2014'"
    end

    it 'validates country_iso2' do
      get :index, params: { country_iso2: "this is not a country" }
      expect(response).to have_http_status :unprocessable_content
      json = response.parsed_body
      expect(json["error"]).to eq "Invalid country_iso2: 'this is not a country'"
    end

    it 'can query by date' do
      last_feb_comp = create(:competition, :confirmed, :visible, starts: Date.new(2015, 2, 1))
      feb_comp = create(:competition, :confirmed, :visible, starts: Date.new(2016, 2, 1))
      march_comp = create(:competition, :confirmed, :visible, starts: Date.new(2016, 3, 1))

      get :index, params: { start: "2015-02-01" }
      json = response.parsed_body
      expect(json.pluck("id")).to eq [march_comp.id, feb_comp.id, last_feb_comp.id]

      get :index, params: { end: "2016-03-01" }
      json = response.parsed_body
      expect(json.pluck("id")).to eq [march_comp.id, feb_comp.id, last_feb_comp.id]

      get :index, params: { start: "2015-02-01", end: "2016-02-15" }
      json = response.parsed_body
      expect(json.pluck("id")).to eq [feb_comp.id, last_feb_comp.id]

      get :index, params: { start: "2015-02-01", end: "2015-02-01" }
      json = response.parsed_body
      expect(json.pluck("id")).to eq [last_feb_comp.id]
    end

    it 'can query by announced_after' do
      create(:competition, :confirmed, :visible, name: "Old comp 2018", announced_at: 3.days.ago)
      create(:competition, :confirmed, :visible, name: "New comp 2018", announced_at: Time.now)
      get :index, params: { announced_after: 2.days.ago }
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json.pluck("name")).to eq ["New comp 2018"]
    end

    it 'paginates' do
      create_list(:competition, 7, :confirmed, :visible)

      get :index, params: { per_page: 5 }
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json.length).to eq 5

      # Parse HTTP Link header mess
      link = response.headers["Link"]
      links = link.split(/, */)
      next_link = links[1]
      url, rel = next_link.split(/; */)
      url = url[1...-1]
      expect(rel).to eq 'rel="next"'

      get :index, params: Rack::Utils.parse_query(URI(url).query)
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json.length).to eq 2
    end
  end

  describe 'wcif' do
    let!(:series) { create(:competition_series) }

    let!(:competition) do
      create(
        :competition,
        :with_delegate,
        :visible,
        id: "TestComp2014",
        name: "Test Comp 2014",
        start_date: "2014-02-03",
        end_date: "2014-02-05",
        external_website: "http://example.com",
        event_ids: %w[333 444],
        latitude: 43_641_740,
        longitude: -79_376_902,
        competition_series: series,
      )
    end

    let!(:hidden_competition) do
      create(
        :competition,
        :not_visible,
        id: "HiddenComp2014",
        start_date: "2014-02-02",
        end_date: "2014-02-02",
        delegates: competition.delegates,
        latitude: 43_641_740,
        longitude: -79_376_902,
        competition_series: series,
      )
    end

    it '404s on invalid competition' do
      get :show_wcif, params: { competition_id: "FakeId2014" }
      expect(response).to have_http_status :not_found
      parsed_body = response.parsed_body
      expect(parsed_body["error"]).to eq "Competition with id FakeId2014 not found"
    end

    it '404s on hidden competition' do
      competition.update_column(:show_at_all, false)
      get :show_wcif, params: { competition_id: "TestComp2014" }
      expect(response).to have_http_status :not_found
      parsed_body = response.parsed_body
      expect(parsed_body["error"]).to eq "Competition with id #{competition.id} not found"
    end

    context 'signed in without manage_competitions scope' do
      let(:delegate) { competition.delegates.first }

      before :each do
        api_sign_in_as(delegate)
      end

      it '404s on hidden competition' do
        get :show_wcif, params: { competition_id: hidden_competition.id }
        expect(response).to have_http_status :not_found
      end

      it 'get wcif' do
        get :show_wcif, params: { competition_id: "TestComp2014" }
        expect(response).to have_http_status :forbidden
      end
    end

    context 'signed in as delegate' do
      let(:delegate) { competition.delegates.first }

      before :each do
        scopes = Doorkeeper::OAuth::Scopes.new
        scopes.add("manage_competitions")
        api_sign_in_as(delegate, scopes: scopes)
      end

      it 'does not 404 on their own hidden competition' do
        get :show_wcif, params: { competition_id: hidden_competition.id }
        expect(response).to have_http_status :ok
        parsed_body = response.parsed_body
        expect(parsed_body["id"]).to eq "HiddenComp2014"
      end

      it 'get wcif' do
        get :show_wcif, params: { competition_id: "TestComp2014" }
        expect(response).to have_http_status :ok
        parsed_body = response.parsed_body
        expect(parsed_body["id"]).to eq "TestComp2014"
      end

      it 'gets wcif with consistent competitor_id' do
        last_registration = nil
        user_competitor_ids = []
        comp_id = 1
        3.times do
          user = create(:user)
          user_competitor_ids << [user.id, comp_id]
          comp_id += 1
          last_registration = create(:registration, :accepted, competition: competition, user: user)
        end
        get_wcif_and_compare_persons_to(competition.id, user_competitor_ids + [[competition.organizers.first.id, nil], [competition.delegates.first.id, nil]])

        # Move last registration to deleted
        last_registration.competing_status = Registrations::Helper::STATUS_CANCELLED
        # Create and register one new user
        user = create(:user)
        last_registration = create(:registration, :accepted, competition: competition, user: user)
        user_competitor_ids << [user.id, comp_id]
        get_wcif_and_compare_persons_to(competition.id, user_competitor_ids + [[competition.organizers.first.id, nil], [competition.delegates.first.id, nil]])
      end

      it 'gets announced and unannounced series competitions ids' do
        get :show_wcif, params: { competition_id: 'TestComp2014' }
        expect(response).to have_http_status :ok
        parsed_body = response.parsed_body
        expect(parsed_body['series']['competitionIds']).to eq %w[HiddenComp2014 TestComp2014]
      end
    end

    context 'accessing public endpoint' do
      it 'gets only announced series competitions ids' do
        get :show_wcif_public, params: { competition_id: 'TestComp2014' }
        expect(response).to have_http_status :ok
        parsed_body = response.parsed_body
        expect(parsed_body['series']['competitionIds']).to eq ['TestComp2014']
      end
    end
  end
end
