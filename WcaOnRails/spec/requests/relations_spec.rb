# frozen_string_literal: true

require "rails_helper"

RSpec.describe "relations" do
  let!(:person1) { FactoryBot.create(:person_with_multiple_sub_ids) }
  let!(:person2) { FactoryBot.create(:person) }
  let!(:competition) { FactoryBot.create(:competition) }

  before do
    FactoryBot.create :result, person: person1, competition: competition
    FactoryBot.create :result, person: person2, competition: competition
    # They have been to the same competition - that's a direct relation.
    Linking.create! [
      { wca_id: person1.wca_id, wca_ids: [person2.wca_id] },
      { wca_id: person2.wca_id, wca_ids: [person1.wca_id] },
    ]
  end

  context "given a person with multiple sub_ids" do
    it "renders properly" do
      get relation_path, params: {
        wca_id1: person1.wca_id,
        wca_id2: person2.wca_id,
      }
      expect(response).to be_successful
      expect(flash.now[:danger]).to be_nil
    end
  end

  context "redirects showing an error message when the given data is invalid" do
    it "one WCA ID is missing" do
      get relation_path, params: {
        wca_id1: person1.wca_id,
      }
      expect_redirect_and_error_message
    end

    it "one WCA ID is invalid" do
      get relation_path, params: {
        wca_id1: person1.wca_id,
        wca_id2: "WRONG!",
      }
      expect_redirect_and_error_message
    end

    it "both WCA IDs are the same" do
      get relation_path, params: {
        wca_id1: person1.wca_id,
        wca_id2: person1.wca_id,
      }
      expect_redirect_and_error_message
    end
  end

  def expect_redirect_and_error_message
    follow_redirect!
    expect(flash[:danger]).to_not be_empty
  end
end
