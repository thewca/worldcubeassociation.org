# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API v1 Bookmarks" do
  let(:competition) { create(:competition, :visible) }
  let(:user) { create(:user) }

  it "requires the user to be logged in" do
    get api_v1_competition_bookmark_path(competition)

    expect(response).to have_http_status(:unauthorized)
  end

  context "when logged in" do
    before { api_sign_in_as(user) }

    describe "GET #show" do
      it "returns false for a competition the user has not bookmarked" do
        get api_v1_competition_bookmark_path(competition)

        expect(response).to be_successful
        expect(response.parsed_body).to eq({ "bookmarked" => false })
      end

      it "returns true for a competition the user has bookmarked" do
        BookmarkedCompetition.create!(competition: competition, user: user)

        get api_v1_competition_bookmark_path(competition)

        expect(response.parsed_body).to eq({ "bookmarked" => true })
      end

      it "returns not found for an unknown competition" do
        get api_v1_competition_bookmark_path("NotAComp2026")

        expect(response).to have_http_status(:not_found)
      end
    end

    describe "POST #create" do
      it "bookmarks the competition" do
        expect { post api_v1_competition_bookmark_path(competition) }
          .to change { user.competition_bookmarked?(competition) }.from(false).to(true)
        expect(response.parsed_body).to eq({ "bookmarked" => true })
      end

      it "does not create a duplicate bookmark" do
        BookmarkedCompetition.create!(competition: competition, user: user)

        expect { post api_v1_competition_bookmark_path(competition) }
          .not_to change(BookmarkedCompetition, :count)
        expect(response).to be_successful
      end
    end

    describe "DELETE #destroy" do
      it "removes the bookmark" do
        BookmarkedCompetition.create!(competition: competition, user: user)

        expect { delete api_v1_competition_bookmark_path(competition) }
          .to change { user.competition_bookmarked?(competition) }.from(true).to(false)
        expect(response.parsed_body).to eq({ "bookmarked" => false })
      end
    end
  end
end
