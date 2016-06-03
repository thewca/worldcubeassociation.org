require 'rails_helper'

describe DelegateReport do
  context "can_view_delegate_report?" do
    let(:other_delegate) { FactoryGirl.create :delegate }
    let(:board_member) { FactoryGirl.create :board_member }

    context "past competition" do
      let(:competition) { FactoryGirl.create :competition, :with_delegate, starts: 1.week.ago }
      let(:delegate) { competition.delegates.first }

      it "cannot view delegate report with unposted report" do
        expect(other_delegate.can_view_delegate_report?(competition.delegate_report)).to eq false
      end

      it "can view delegate report with posted report" do
        competition.delegate_report.update_attributes!(schedule_url: "http://example.com", posted: true)

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
      let(:competition) { FactoryGirl.create :competition, :with_delegate, starts: 1.week.from_now }
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
