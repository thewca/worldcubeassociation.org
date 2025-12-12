# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::V0::ApiController, :clean_db_with_truncation do
  describe 'GET #competitions_search' do
    let!(:comp) { create(:competition, :confirmed, :visible, name: "Jfly's Competition 2015") }

    it 'requires query parameter' do
      get :competitions_search
      expect(response).to have_http_status :bad_request
      json = response.parsed_body
      expect(json["error"]).to eq "No query specified"
    end

    it "finds competition" do
      get :competitions_search, params: { q: "competition" }
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json["result"].length).to eq 1
    end

    it "works well with multiple parts" do
      get :competitions_search, params: { q: "Jfly Comp 15" }
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json["result"].length).to eq 1
    end
  end

  describe 'GET #posts_search' do
    let!(:post) { create(:post, title: "post title", body: "post body") }

    it 'requires query parameter' do
      get :posts_search
      expect(response).to have_http_status :bad_request
      json = response.parsed_body
      expect(json["error"]).to eq "No query specified"
    end

    it "finds post" do
      get :posts_search, params: { q: "post title" }
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json["result"].length).to eq 1
    end
  end

  describe 'GET #users_search' do
    before :each do
      # We cache search results, which is a very good thing in production because we have an Omnisearch bar.
      # But in these tests, we sometimes modify properties of an existing user (make Jeremy a Delegate, turn his account
      # into a hidden account, etc.) and these spontaneous updates don't reflect in the cache.
      # So just clear it for these tests.
      Rails.cache.delete_matched 'search/User*'
    end

    let(:person) { create(:person, name: "Jeremy", wca_id: "2005FLEI01") }
    let!(:user) { create(:user, person: person, email: "example@email.com") }

    it 'requires query parameter' do
      get :users_search
      expect(response).to have_http_status :bad_request
      json = response.parsed_body
      expect(json["error"]).to eq "No query specified"
    end

    it 'finds Jeremy' do
      get :users_search, params: { q: "erem" }
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json["result"].find { |u| u["name"] == "Jeremy" }).not_to be_nil
    end

    it 'does not find dummy accounts' do
      create(:dummy_user, name: "Aaron")
      get :users_search, params: { q: "aaron" }
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json["result"].length).to eq 0
    end

    it 'can find dummy accounts' do
      user.update_column(:encrypted_password, "")
      get :users_search, params: { q: "erem", include_dummy_accounts: true }
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json["result"].length).to eq 1
      expect(json["result"][0]["id"]).to eq user.id
    end

    it 'can find by wca_id' do
      get :users_search, params: { q: user.wca_id }
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json["result"].length).to eq 1
      expect(json["result"][0]["id"]).to eq user.id
    end

    it "can find by email" do
      get :users_search, params: { q: "example", email: true }
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json["result"].length).to eq 1
      expect(json["result"][0]["id"]).to eq user.id
    end

    context 'Person without User' do
      let!(:userless_person) { create(:person, name: "Bob") }

      it "can find by wca_id" do
        get :users_search, params: { q: userless_person.wca_id, persons_table: true }
        expect(response).to have_http_status :ok
        json = response.parsed_body
        expect(json["result"].length).to eq 1
        expect(json["result"][0]["id"]).to eq userless_person.wca_id
        expect(json["result"][0]["wca_id"]).to eq userless_person.wca_id
        default_avatar = UserAvatar.default_avatar(nil)
        expect(json['result'][0]['avatar']['url']).to eq default_avatar.url
        expect(json['result'][0]['avatar']['thumb_url']).to eq default_avatar.thumbnail_url
        expect(json['result'][0]['avatar']['is_default']).to be true
      end

      it "can find by name" do
        get :users_search, params: { q: "bo", persons_table: true }
        expect(response).to have_http_status :ok
        json = response.parsed_body
        expect(json["result"].length).to eq 1
        expect(json["result"][0]["id"]).to eq userless_person.wca_id
        expect(json["result"][0]["wca_id"]).to eq userless_person.wca_id
      end
    end

    it 'does not find unconfirmed accounts' do
      user.update_column(:confirmed_at, nil)
      get :users_search, params: { q: "erem" }
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json["result"].length).to eq 0
    end

    it 'can only find delegates' do
      delegate = create(:delegate, name: "Jeremy")
      get :users_search, params: { q: "erem", only_staff_delegates: true }
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json["result"].length).to eq 1
      expect(json["result"][0]["id"]).to eq delegate.id
    end
  end

  describe 'GET #omni_search' do
    let!(:user) { create(:delegate, name: "Jeremy Fleischman") }
    let!(:comp) { create(:competition, :confirmed, :visible, name: "jeremy Jfly's Competition 2015", delegates: [user]) }
    let!(:post) { create(:post, title: "jeremy post title", body: "post body", author: user) }

    s3 = Aws::S3::Client.new(stub_responses: true)
    s3.stub_responses(:get_object, ->(_) { { body: "{}" } })
    Regulation.reload_regulations(Aws::S3::Resource.new(client: s3))

    it 'requires query parameter' do
      get :omni_search
      expect(response).to have_http_status :bad_request
      json = response.parsed_body
      expect(json["error"]).to eq "No query specified"
    end

    it "finds all the things!" do
      get :omni_search, params: { q: "jeremy" }
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json["result"].length).to eq 2
      expect(json["result"].count { |r| r["class"] == "competition" }).to eq 1
      expect(json["result"].count { |r| r["class"] == "post" }).to eq 0
      expect(json["result"].count { |r| r["class"] == "user" }).to eq 0
      expect(json["result"].count { |r| r["class"] == "person" }).to eq 1
    end

    it "works well when parts of the name are given" do
      get :omni_search, params: { q: "Flei Jer" }
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json["result"].length).to eq 1
      expect(json["result"][0]["name"]).to include "Jeremy Fleischman"
    end
  end

  describe 'GET #delegates' do
    it 'includes emails and regions' do
      senior_delegate = create(:senior_delegate_role)
      delegate = create(:delegate_role, group_id: senior_delegate.group.id)

      get :delegates
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json.length).to eq 2

      delegate_json = json.find { |user| user["id"] == delegate.user.id }
      expect(delegate_json["email"]).to eq delegate.user.email
      expect(delegate_json["location"]).to eq delegate.metadata.location
      expect(delegate_json["region_id"]).to eq senior_delegate.group.id
    end
  end

  describe 'GET #scramble_program' do
    it 'works' do
      get :scramble_program
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json["current"]["name"]).to eq "TNoodle-WCA-1.2.2"
      # the actual key resides in regulations-data, so in the test environment it will simply prompt "false"
      expect(json["publicKeyBytes"]).to be false
    end
  end

  describe 'GET #me' do
    context 'not signed in' do
      it 'returns 401' do
        get :me
        expect(response).to have_http_status :unauthorized
        json = response.parsed_body
        expect(json['error']).to eq("Not authorized")
      end
    end

    context 'signed in as board member' do
      before :each do
        api_sign_in_as(create(:user, :board_member))
      end

      it 'has correct team membership' do
        get :me
        expect(response).to have_http_status :ok
        json = response.parsed_body

        expect(json['me']['teams'].length).to eq 1
        team = json['me']['teams'].first
        expect(team['friendly_id']).to eq 'board'
        expect(team['leader']).to be false
      end
    end

    context 'signed in as Junior delegate' do
      before :each do
        api_sign_in_as(create(:junior_delegate))
      end

      it 'has correct delegate_status' do
        get :me
        expect(response).to have_http_status :ok
        json = response.parsed_body

        expect(json['me']['delegate_status']).to eq 'junior_delegate'
      end
    end

    context 'signed in as delegate' do
      before :each do
        api_sign_in_as(create(:delegate))
      end

      it 'has correct delegate_status' do
        get :me
        expect(response).to have_http_status :ok
        json = response.parsed_body

        expect(json['me']['delegate_status']).to eq 'delegate'
      end
    end

    context 'signed in as a member of some teams and a leader of others' do
      before :each do
        user = create(:user, :with_avatar, :wic_leader, :wrc_member)
        api_sign_in_as(user)
      end

      it 'has correct team membership' do
        get :me
        expect(response).to have_http_status :ok
        json = response.parsed_body

        expect(json['me']['delegate_status']).to be_nil
        expect(json['me']['teams'].length).to eq 2
        team = json['me']['teams'].find { |t| t['friendly_id'] == 'wrc' }
        expect(team['leader']).to be false
        expect(team['friendly_id']).to eq 'wrc'
        expect(team['avatar']['url']).to be_a String
        expect(team['id']).to be_a Numeric
        expect(team['name']).to be_a String
        expect(team['senior_member']).to be false
      end
    end

    context 'signed in with valid wca id' do
      let(:person) do
        create(
          :person,
          country_id: "USA",
          gender: "m",
          dob: '1987-12-04',
        )
      end
      let(:user) do
        create(
          :user,
          :with_avatar,
          wca_id: person.wca_id,
        )
      end
      let(:scopes) { Doorkeeper::OAuth::Scopes.new }

      before :each do
        api_sign_in_as(user, scopes: scopes)
      end

      it 'works' do
        get :me
        expect(response).to have_http_status :ok
        json = response.parsed_body
        expect(json['me']['wca_id']).to eq(user.wca_id)
        expect(json['me']['name']).to eq(user.name)

        # Verify that avatar url is a full url (starts with http(s))
        expect(json['me']['avatar']['url']).to match(/^https?/)

        expect(json['me']['country_iso2']).to eq("US")
        expect(json['me']['gender']).to eq("m")

        expect(json['me']['dob']).to be_nil
        expect(json['me']['email']).to be_nil

        expect(json['me']['delegate_status']).to be_nil
        expect(json['me']['teams']).to eq([])
      end

      it 'can request dob scope' do
        scopes.add("dob")

        get :me
        expect(response).to have_http_status :ok
        json = response.parsed_body
        expect(json['me']['dob']).to eq("1987-12-04")
        expect(json['me']['email']).to be_nil
      end

      it 'can request email scope' do
        scopes.add("email")

        get :me
        expect(response).to have_http_status :ok
        json = response.parsed_body
        expect(json['me']['email']).to eq(user.email)
      end

      it 'can request email and dob scope' do
        scopes.add("dob", "email")

        get :me
        expect(response).to have_http_status :ok
        json = response.parsed_body
        expect(json['me']['dob']).to eq("1987-12-04")
        expect(json['me']['email']).to eq(user.email)
      end
    end

    context 'signed in with invalid wca id' do
      let(:user) do
        u = create(:user, country_iso2: "US")
        u.update_column(:wca_id, "fooooo")
        u
      end
      let(:scopes) { Doorkeeper::OAuth::Scopes.new }
      let(:token) { double acceptable?: true, accessible?: true, resource_owner_id: user.id, scopes: scopes }

      before :each do
        allow(controller).to receive(:doorkeeper_token) { token }
      end

      it 'works' do
        scopes.add("dob", "email")

        get :me
        expect(response).to have_http_status :ok
        json = response.parsed_body
        expect(json['me']['wca_id']).to eq(user.wca_id)
        expect(json['me']['name']).to eq(user.name)
        expect(json['me']['email']).to eq(user.email)
        default_avatar = UserAvatar.default_avatar(user)
        expect(json['me']['avatar']['url']).to eq default_avatar.url
        expect(json['me']['avatar']['thumb_url']).to eq default_avatar.thumbnail_url
        expect(json['me']['avatar']['is_default']).to be true

        expect(json['me']['country_iso2']).to eq "US"
        expect(json['me']['gender']).to eq "m"
        expect(json['me']['dob']).to eq user.dob.strftime("%F")
      end
    end

    context 'signed in without wca id' do
      let(:user) { create(:user, country_iso2: "US") }
      let(:scopes) { Doorkeeper::OAuth::Scopes.new }
      let(:token) { double acceptable?: true, accessible?: true, resource_owner_id: user.id, scopes: scopes }

      before :each do
        allow(controller).to receive(:doorkeeper_token) { token }
      end

      it 'works' do
        scopes.add("dob", "email")

        get :me
        expect(response).to have_http_status :ok
        json = response.parsed_body
        expect(json['me']['wca_id']).to eq(user.wca_id)
        expect(json['me']['name']).to eq(user.name)
        expect(json['me']['email']).to eq(user.email)
        default_avatar = UserAvatar.default_avatar(user)
        expect(json['me']['avatar']['url']).to eq default_avatar.url
        expect(json['me']['avatar']['thumb_url']).to eq default_avatar.thumbnail_url
        expect(json['me']['avatar']['is_default']).to be true

        expect(json['me']['country_iso2']).to eq "US"
        expect(json['me']['gender']).to eq "m"
        expect(json['me']['dob']).to eq user.dob.strftime("%F")
      end
    end
  end

  describe 'GET #export_public' do
    it 'returns information about latest public export' do
      export_timestamp = DateTime.current.utc
      DumpPublicResultsDatabase.cronjob_statistics.update!(successful_run_start: export_timestamp)

      get :export_public
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json).to eq(
        'export_date' => export_timestamp.iso8601,
        'sql_url' => "#{root_url}export/results/WCA_export.sql.zip",
        'sql_filesize_bytes' => 123_456,
        'tsv_url' => "#{root_url}export/results/WCA_export.tsv.zip",
        'tsv_filesize_bytes' => 123_456,
        'developer_url' => "#{ENV.fetch('DUMP_HOST', nil)}/export/developer/wca-developer-database-dump.zip",
        'readme' => "",
      )
    end
  end

  describe 'GET #competition_series/:id' do
    let!(:series) { create(:competition_series) }
    let!(:competition1) { create(:competition, :confirmed, :visible, competition_series: series, latitude: 43_641_740, longitude: -79_376_902, start_date: '2023-01-01', end_date: '2023-01-01') }
    let!(:competition2) { create(:competition, :confirmed, :visible, competition_series: series, latitude: 43_641_740, longitude: -79_376_902, start_date: '2023-01-02', end_date: '2023-01-02') }
    let!(:competition3) { create(:competition, :confirmed, :visible, competition_series: series, latitude: 43_641_740, longitude: -79_376_902, start_date: '2023-01-03', end_date: '2023-01-03') }

    it 'returns series portion of wcif json' do
      get :competition_series, params: { id: series.wcif_id }
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json).to eq(
        'id' => series.wcif_id,
        'name' => series.name,
        'shortName' => series.short_name,
        'competitionIds' => [competition1.id, competition2.id, competition3.id],
      )
    end

    it 'returns series portion of wcif json with only competitions that are publicly visible' do
      competition2.update_column(:show_at_all, false)
      get :competition_series, params: { id: series.wcif_id }
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json).to eq(
        'id' => series.wcif_id,
        'name' => series.name,
        'shortName' => series.short_name,
        'competitionIds' => [competition1.id, competition3.id],
      )
    end

    it 'returns 404 when all competitions in series are not visible' do
      competition1.update_column(:show_at_all, false)
      competition2.update_column(:show_at_all, false)
      competition3.update_column(:show_at_all, false)
      get :competition_series, params: { id: series.wcif_id }
      expect(response).to have_http_status :not_found
      json = response.parsed_body
      expect(json['error']).to eq "Competition series with ID #{series.wcif_id} not found"
    end

    it 'returns 404 for unknown competition series id' do
      get :competition_series, params: { id: 'UnknownSeries1989' }
      expect(response).to have_http_status :not_found
      json = response.parsed_body
      expect(json['error']).to eq 'Competition series with ID UnknownSeries1989 not found'
    end
  end

  describe 'GET #user_qualification_data' do
    it 'returns empty JSON if user has never competed' do
      user = create(:user)
      get :user_qualification_data, params: { user_id: user.id }
      expect(response.parsed_body).to eq([])
    end

    it 'returns error if date is not iso8601 formatted' do
      user = create(:user)
      get :user_qualification_data, params: { user_id: user.id, date: 'bad data' }

      expect(response).to have_http_status(:bad_request)
      expect(response.body).to include('Invalid date format. Please provide an iso8601 date string.')
    end

    it 'fails if date is in the future' do
      user = create(:user)
      get :user_qualification_data, params: { user_id: user.id, date: 1.day.from_now }

      expect(response).to have_http_status(:bad_request)
      expect(response.body).to include('You cannot request qualification data for a future date.')
    end

    it 'returns only single if the user has no average' do
      expected_response = [
        { "best" => 400, "eventId" => "333oh", "type" => "single", "on_or_before" => Date.current.iso8601 },
      ]

      @competition = create(:competition) # Results will be achieved 1.year.ago - see factory definition
      @result = create(:result, competition: @competition, best: 400, average: -1)
      @user = create(:user_with_wca_id, person: @result.person)

      get :user_qualification_data, params: { user_id: @user.id }
      expect(response.parsed_body).to eq(expected_response)
    end

    it 'returns empty array if the user only has a DNF' do
      @competition = create(:competition)
      @result = create(:result, competition: @competition, best: -1, average: -1)
      @user = create(:user_with_wca_id, person: @result.person)

      get :user_qualification_data, params: { user_id: @user.id }
      expect(response.parsed_body).to eq([])
    end

    context 'user has competed' do
      before do
        @competition = create(:competition) # Results will be achieved 1.year.ago - see factory definition
        @result = create(:result, competition: @competition, best: 400, average: 500)
        @user = create(:user_with_wca_id, person: @result.person)

        @default_expected_response = [
          { "best" => 400, "eventId" => "333oh", "type" => "single", "on_or_before" => Date.current.iso8601 },
          { "best" => 500, "eventId" => "333oh", "type" => "average", "on_or_before" => Date.current.iso8601 },
        ]
      end

      it 'if no date is specified, returns qualification up until the current date' do
        expected_response = [
          { "best" => 400, "eventId" => "333oh", "type" => "single", "on_or_before" => Date.current.iso8601 },
          { "best" => 500, "eventId" => "333oh", "type" => "average", "on_or_before" => Date.current.iso8601 },
        ]

        get :user_qualification_data, params: { user_id: @user.id }
        expect(response.parsed_body).to eq(expected_response)
      end

      it 'returns qualification up to and including the given date' do
        expected_response = [
          { "best" => 400, "eventId" => "333oh", "type" => "single", "on_or_before" => 100.days.ago.to_date.iso8601 },
          { "best" => 500, "eventId" => "333oh", "type" => "average", "on_or_before" => 100.days.ago.to_date.iso8601 },
        ]

        get :user_qualification_data, params: { user_id: @user.id, date: 100.days.ago }
        expect(response.parsed_body).to eq(expected_response)
      end

      it 'returns empty json if user had not competed by the given date' do
        expected_response = []

        get :user_qualification_data, params: { user_id: @user.id, date: 2.years.ago }
        expect(response.parsed_body).to eq(expected_response)
      end

      it 'works as expected when the user has 2 identical PRs' do
        expected_response = [
          { "best" => 400, "eventId" => "333oh", "type" => "single", "on_or_before" => Date.current.iso8601 },
          { "best" => 500, "eventId" => "333oh", "type" => "average", "on_or_before" => Date.current.iso8601 },
        ]

        competition = create(:competition, starts: 200.days.ago)
        create(:result, competition: competition, best: 400, average: 500)

        get :user_qualification_data, params: { user_id: @user.id }
        expect(response.parsed_body).to eq(expected_response)
      end

      it 'includes result achieved before the qualification date' do
        expected_response = [
          { "best" => 400, "eventId" => "333oh", "type" => "single", "on_or_before" => 2.days.ago.to_date.iso8601 },
          { "best" => 500, "eventId" => "333oh", "type" => "average", "on_or_before" => 2.days.ago.to_date.iso8601 },
        ]

        get :user_qualification_data, params: { user_id: @user.id, date: 2.days.ago }
        expect(response.parsed_body).to eq(expected_response)
      end

      it 'includes result achieved on the qualification date' do
        expected_response = [
          { "best" => 399, "eventId" => "333oh", "type" => "single", "on_or_before" => 1.day.ago.to_date.iso8601 },
          { "best" => 499, "eventId" => "333oh", "type" => "average", "on_or_before" => 1.day.ago.to_date.iso8601 },
        ]

        competition = create(:competition, starts: 1.day.ago)
        create(:result, competition: competition, best: 399, average: 499, person: @result.person)

        get :user_qualification_data, params: { user_id: @user.id, date: 1.day.ago }
        expect(response.parsed_body).to eq(expected_response)
      end

      it 'does not include result achieved after the qualification date' do
        expected_response = [
          { "best" => 400, "eventId" => "333oh", "type" => "single", "on_or_before" => 2.days.ago.to_date.iso8601 },
          { "best" => 500, "eventId" => "333oh", "type" => "average", "on_or_before" => 2.days.ago.to_date.iso8601 },
        ]

        competition = create(:competition, starts: 1.day.ago)
        create(:result, competition: competition, best: 399, average: 499, person: @result.person)

        get :user_qualification_data, params: { user_id: @user.id, date: 2.days.ago }
        expect(response.parsed_body).to eq(expected_response)
      end

      it 'still returns PR when user has DNF result' do
        competition = create(:competition, starts: 1.day.ago)
        create(:result, competition: competition, best: -1, average: -1, person: @result.person)

        get :user_qualification_data, params: { user_id: @user.id }
        expect(response.parsed_body).to eq(@default_expected_response)
      end
    end
  end
end
