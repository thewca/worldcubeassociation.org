# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Trainee Delegate applications" do
  let(:applicant) { create(:user_with_wca_id) }
  let(:root_region) { GroupsMetadataDelegateRegions.find_by!(friendly_id: "europe").user_group }
  let(:target_region) { GroupsMetadataDelegateRegions.find_by!(friendly_id: "europe-north").user_group }
  let(:regional_delegate) { create(:user_with_wca_id) }
  let(:senior_delegate) { create(:user_with_wca_id) }
  let(:recommender) { create(:user_with_wca_id) }

  let!(:regional_role) { create(:regional_delegate_role, user: regional_delegate, group: target_region) }

  let(:valid_application) do
    {
      delegate_region_id: target_region.id,
      spoken_to_delegate_user_ids: [recommender.id],
      recommender_user_ids: [recommender.id],
      introduction: "I am an experienced organizer.",
      competition_contributions: "I regularly help with setup and scoretaking.",
      motivation: "I want to support competitions in my region.",
      relevant_skills: "Communication and organization.",
      cubing_business_involvement: false,
      declarations: TraineeDelegateApplication::DECLARATIONS.index_with(true),
    }
  end

  before do
    create(:senior_delegate_role, user: senior_delegate, group: root_region)
    create(:delegate_role, user: recommender, group: target_region)
  end

  it "requires login" do
    get trainee_delegate_application_path

    expect(response).to redirect_to(new_user_session_path)
  end

  context "when signed in" do
    before { sign_in applicant }

    it "emails the Regional Delegate and copies the Senior Delegate" do
      post trainee_delegate_application_path, params: { trainee_delegate_application: valid_application }, as: :json

      expect(response).to be_successful
      mail = ActionMailer::Base.deliveries.last
      expect(mail.to).to eq([regional_delegate.email])
      expect(mail.cc).to eq([senior_delegate.email, applicant.email, "assistants@worldcubeassociation.org"])
    end

    it "falls back to the Senior Delegate when the region has no Regional Delegate" do
      regional_role.update!(end_date: Date.today)

      post trainee_delegate_application_path, params: { trainee_delegate_application: valid_application }, as: :json

      expect(ActionMailer::Base.deliveries.last.to).to eq([senior_delegate.email])
    end

    it "rejects an applicant who is under 17" do
      sign_out applicant
      applicant.update_column(:dob, 17.years.ago.to_date + 1.day)
      sign_in applicant.reload

      post trainee_delegate_application_path, params: { trainee_delegate_application: valid_application }, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to include("Applicants must be at least 17 years old.")
    end

    it "rejects a recommender from another region" do
      other_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: "africa").user_group
      other_recommender = create(:user_with_wca_id)
      create(:delegate_role, user: other_recommender, group: other_region)

      post trainee_delegate_application_path,
           params: { trainee_delegate_application: valid_application.merge(recommender_user_ids: [other_recommender.id]) },
           as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(ActionMailer::Base.deliveries).to be_empty
    end

    it "returns a recoverable error when email delivery fails" do
      allow(TraineeDelegateApplicationsMailer).to receive(:new_application).and_raise(Net::SMTPFatalError.new("delivery failed"))

      post trainee_delegate_application_path, params: { trainee_delegate_application: valid_application }, as: :json

      expect(response).to have_http_status(:service_unavailable)
    end
  end
end
