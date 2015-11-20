require 'rails_helper'

describe Api::V0::ApiController do
  describe 'GET #competitions_search' do
    let!(:comp) { FactoryGirl.create(:competition, name: "Jfly's Competition 2015") }

    it 'requires query parameter' do
      get :competitions_search
      expect(response.status).to eq 400
      json = JSON.parse(response.body)
      expect(json["error"]).to eq "No query specified"
    end

    it "finds competition" do
      get :competitions_search, q: "competition"
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["result"].length).to eq 1
    end
  end

  describe 'GET #posts_search' do
    let!(:post) { FactoryGirl.create(:post, title: "post title", body: "post body") }

    it 'requires query parameter' do
      get :posts_search
      expect(response.status).to eq 400
      json = JSON.parse(response.body)
      expect(json["error"]).to eq "No query specified"
    end

    it "finds post" do
      get :posts_search, q: "post title"
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["result"].length).to eq 1
    end

    it "does not find non world readable post" do
      post.update_column(:world_readable, false)
      get :posts_search, q: "post title"
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["result"].length).to eq 0
    end
  end

  describe 'GET #users_search' do
    let!(:user) { FactoryGirl.create(:user_with_wca_id, name: "Jeremy") }

    it 'requires query parameter' do
      get :users_search
      expect(response.status).to eq 400
      json = JSON.parse(response.body)
      expect(json["error"]).to eq "No query specified"
    end

    it 'finds Jeremy' do
      get :users_search, q: "erem"
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["result"].select { |u| u["name"] == "Jeremy"}[0]).not_to be_nil
    end

    it 'does not find dummy accounts' do
      user.update_column(:encrypted_password, "")
      get :users_search, q: "erem"
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["result"].length).to eq 0
    end

    it 'can find dummy accounts' do
      user.update_column(:encrypted_password, "")
      get :users_search, q: "erem", include_dummy_accounts: true
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["result"].length).to eq 1
      expect(json["result"][0]["id"]).to eq user.id
    end

    it 'can find by wca_id' do
      get :users_search, q: user.wca_id
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["result"].length).to eq 1
      expect(json["result"][0]["id"]).to eq user.id
    end

    context 'Person without User' do
      let!(:person) { FactoryGirl.create(:person, name: "Bob") }

      it "can find by wca_id" do
        get :users_search, q: person.id, persons_table: true
        expect(response.status).to eq 200
        json = JSON.parse(response.body)
        expect(json["result"].length).to eq 1
        expect(json["result"][0]["id"]).to eq nil
        expect(json["result"][0]["wca_id"]).to eq person.id
      end

      it "can find by name" do
        get :users_search, q: "bo", persons_table: true
        expect(response.status).to eq 200
        json = JSON.parse(response.body)
        expect(json["result"].length).to eq 1
        expect(json["result"][0]["id"]).to eq nil
        expect(json["result"][0]["wca_id"]).to eq person.id
      end
    end

    it 'does not find unconfirmed accounts' do
      user.update_column(:confirmed_at, nil)
      get :users_search, q: "erem"
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["result"].length).to eq 0
    end

    it 'can only find delegates' do
      delegate = FactoryGirl.create(:delegate, name: "Jeremy")
      get :users_search, q: "erem", only_delegates: true
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["result"].length).to eq 1
      expect(json["result"][0]["id"]).to eq delegate.id
    end
  end

  describe 'show_user_*' do
    it 'can query by id' do
      user = FactoryGirl.create(:user, name: "Jeremy")
      get :show_user_by_id, id: user.id
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["user"]["name"]).to eq "Jeremy"
      expect(json["user"]["wca_id"]).to eq user.wca_id
    end

    it 'can query by wca id' do
      user = FactoryGirl.create(:user_with_wca_id)
      get :show_user_by_wca_id, wca_id: user.wca_id
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["user"]["name"]).to eq user.name
      expect(json["user"]["wca_id"]).to eq user.wca_id
    end

    it '404s nicely' do
      get :show_user_by_wca_id, wca_id: "foo"
      expect(response.status).to eq 404
      json = JSON.parse(response.body)
      expect(json["user"]).to be nil
    end
  end

  describe 'GET #scramble_program' do
    it 'works' do
      get :scramble_program
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["current"]["name"]).to eq "TNoodle-WCA-0.10.0"
    end
  end

  describe 'GET #me' do
    context 'not signed in' do
      it 'returns 401' do
        get :me
        expect(response.status).to eq 401
        json = JSON.parse(response.body)
        expect(json['error']).to eq("Not authorized")
      end
    end

    context 'signed in with valid wca id' do
      let(:person) do
        FactoryGirl.create(:person, {
          countryId: "USA",
          gender: "m",
          year: 1987,
          month: 12,
          day: 4,
        })
      end
      let(:user) do
        FactoryGirl.create :user, {
          avatar: File.open(Rails.root.join("spec/support/logo.jpg")),
          wca_id: person.id,
        }
      end
      let(:token) { double acceptable?: true, resource_owner_id: user.id }
      before :each do
        allow(controller).to receive(:doorkeeper_token) {token}
      end

      it 'works' do
        get :me
        expect(response.status).to eq 200
        json = JSON.parse(response.body)
        expect(json['me']['wca_id']).to eq(user.wca_id)
        expect(json['me']['name']).to eq(user.name)
        expect(json['me']['email']).to eq(user.email)
        # Verify that avatar url is a full url (starts with http(s))
        expect(json['me']['avatar']['url']).to match /^https?/

        expect(json['me']['country_iso2']).to eq("US")
        expect(json['me']['gender']).to eq("m")
        expect(json['me']['dob']).to eq("1987-12-04")
      end
    end

    context 'signed in with invalid wca id' do
      let(:user) do
        u = FactoryGirl.create :user
        u.update_column(:wca_id, "fooooo")
        u
      end
      let(:token) { double acceptable?: true, resource_owner_id: user.id }
      before :each do
        allow(controller).to receive(:doorkeeper_token) {token}
      end

      it 'works' do
        get :me
        expect(response.status).to eq 200
        json = JSON.parse(response.body)
        expect(json['me']['wca_id']).to eq(user.wca_id)
        expect(json['me']['name']).to eq(user.name)
        expect(json['me']['email']).to eq(user.email)
        expect(json['me']['avatar']).to be_nil

        expect(json['me']['country_iso2']).to be_nil
        expect(json['me']['gender']).to be_nil
        expect(json['me']['dob']).to be_nil
      end
    end

    context 'signed in without wca id' do
      let(:user) { FactoryGirl.create :user }
      let(:token) { double acceptable?: true, resource_owner_id: user.id }
      before :each do
        allow(controller).to receive(:doorkeeper_token) {token}
      end

      it 'works' do
        get :me
        expect(response.status).to eq 200
        json = JSON.parse(response.body)
        expect(json['me']['wca_id']).to eq(user.wca_id)
        expect(json['me']['name']).to eq(user.name)
        expect(json['me']['email']).to eq(user.email)
        expect(json['me']['avatar']).to be_nil

        expect(json['me']['country_iso2']).to be_nil
        expect(json['me']['gender']).to be_nil
        expect(json['me']['dob']).to be_nil
      end
    end
  end
end
