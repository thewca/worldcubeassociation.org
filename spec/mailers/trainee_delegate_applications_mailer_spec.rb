# frozen_string_literal: true

require "rails_helper"

RSpec.describe TraineeDelegateApplicationsMailer do
  let(:applicant) { create(:user_with_wca_id, name: "Applicant Name") }
  let(:region) { GroupsMetadataDelegateRegions.find_by!(friendly_id: "africa").user_group }
  let(:senior_delegate) { create(:user_with_wca_id) }
  let(:recommender) { create(:user_with_wca_id) }
  let(:application) do
    TraineeDelegateApplication.create!(
      applicant: applicant,
      delegate_region: region,
      spoken_to_delegates: [recommender],
      recommenders: [recommender],
      introduction: "My introduction",
      competition_contributions: "My competition contributions",
      motivation: "My motivation",
      relevant_skills: "My relevant skills",
      is_involved_in_cubing_business: false,
      declarations: TraineeDelegateApplication::DECLARATIONS.index_with(true),
    )
  end

  before do
    create(:senior_delegate_role, user: senior_delegate, group: region)
    create(:delegate_role, user: recommender, group: region)
  end

  it "renders in English" do
    mail = I18n.with_locale(:'es-ES') do
      described_class.new_application(application)
    end

    expect(mail.to).to eq([senior_delegate.email])
    expect(mail.cc).to eq([applicant.email, "assistants@worldcubeassociation.org"])
    expect(mail.reply_to).to eq([applicant.email])
    expect(mail.subject).to eq("Trainee Delegate application - Applicant Name (Africa)")
    expect(mail.body.encoded).to include("My introduction", "My motivation", recommender.name)
  end
end
