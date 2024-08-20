# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DelegateReport do
  it "factory makes a valid delegate report" do
    dr = FactoryBot.create :delegate_report
    expect(dr).to be_valid
  end

  it "expects schedule_url to be a url" do
    dr = FactoryBot.build :delegate_report, schedule_url: "i am clearly not a url", discussion_url: nil
    expect(dr).to be_invalid_with_errors schedule_url: ["must be a valid url starting with http:// or https://"]
  end

  it "expects discussion_url to be a url" do
    dr = FactoryBot.build :delegate_report, schedule_url: nil, discussion_url: "i am clearly not a url"
    expect(dr).to be_invalid_with_errors discussion_url: ["must be a valid url starting with http:// or https://"]
  end

  it "schedule_url is required when posted" do
    dr = FactoryBot.build :delegate_report, schedule_url: nil
    expect(dr).to be_valid

    dr.posted = true
    expect(dr).to be_invalid_with_errors schedule_url: ["can't be blank"]

    dr.schedule_url = "http://example.com"
    expect(dr).to be_valid
  end

  it "discussion_url is set on creation" do
    dr = FactoryBot.create :delegate_report
    expect(dr.discussion_url).to eq "https://groups.google.com/a/worldcubeassociation.org/forum/#!topicsearchin/reports/" + URI.encode_www_form_component(dr.competition.name)
  end

  it "wrc_feedback_requested is set false on creation" do
    dr = FactoryBot.create :delegate_report
    expect(dr.wrc_feedback_requested).to eq false
  end

  it "wrc_incidents is required when wrc_feedback_requested is true" do
    dr = FactoryBot.build :delegate_report
    expect(dr).to be_valid

    dr.wrc_feedback_requested = true
    expect(dr).to be_invalid_with_errors wrc_incidents: ["can't be blank"]

    dr.wrc_incidents = "1, 2, 3"
    expect(dr).to be_valid
  end

  it "wic_feedback_requested is set false on creation" do
    dr = FactoryBot.create :delegate_report
    expect(dr.wic_feedback_requested).to eq false
  end

  it "wic_incidents is required when wic_feedback_requested is true" do
    dr = FactoryBot.build :delegate_report
    expect(dr).to be_valid

    dr.wic_feedback_requested = true
    expect(dr).to be_invalid_with_errors wic_incidents: ["can't be blank"]

    dr.wic_incidents = "4, 5, 6"
    expect(dr).to be_valid
  end

  context "can_view_delegate_report?" do
    let(:other_delegate) { FactoryBot.create :delegate }
    let(:board_member) { FactoryBot.create :user, :board_member }

    context "past competition" do
      let(:competition) { FactoryBot.create :competition, :with_delegate, starts: 1.week.ago }
      let(:delegate) { competition.delegates.first }

      it "cannot view delegate report with unposted report" do
        expect(other_delegate.can_view_delegate_report?(competition.delegate_report)).to eq false
      end

      it "can view delegate report with posted report" do
        competition.delegate_report.update!(schedule_url: "http://example.com", posted: true)

        expect(other_delegate.can_view_delegate_report?(competition.delegate_report)).to eq true
      end

      it "can view own delegate report for unposted report" do
        expect(delegate.can_view_delegate_report?(competition.delegate_report)).to eq true
      end

      it "board member can view delegate report for unposted report" do
        expect(board_member.can_view_delegate_report?(competition.delegate_report)).to eq true
      end
    end

    context "upcoming competition" do
      let(:competition) { FactoryBot.create :competition, :with_delegate, starts: 1.week.from_now }
      let(:delegate) { competition.delegates.first }

      it "cannot view delegate report with unposted report" do
        expect(other_delegate.can_view_delegate_report?(competition.delegate_report)).to eq false
      end

      it "can view own delegate report for unposted report" do
        expect(delegate.can_view_delegate_report?(competition.delegate_report)).to eq true
      end

      it "board member can view delegate report for unposted report" do
        expect(board_member.can_view_delegate_report?(competition.delegate_report)).to eq true
      end
    end
  end
end
