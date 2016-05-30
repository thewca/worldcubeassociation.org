require 'rails_helper'

describe DelegateReport do
  context "can_view_delegate_report?" do
    it "cannot view delegate report for past competition with unposted report" do
      competition = FactoryGirl.create :competition, starts: 1.week.ago
      other_delegate = FactoryGirl.create :delegate

      expect(other_delegate.can_view_delegate_report?(competition.delegate_report)).to eq false
    end

    it "can view delegate report for past competition with posted report" do
      competition = FactoryGirl.create :competition, starts: 1.week.ago
      competition.delegate_report.update_attributes(posted: true)
      other_delegate = FactoryGirl.create :delegate

      expect(other_delegate.can_view_delegate_report?(competition.delegate_report)).to eq true
    end

    it "can view delegate report for unposted report if competition's delegate" do
      competition = FactoryGirl.create :competition, :with_delegate
      delegate = competition.delegates.first

      expect(delegate.can_view_delegate_report?(competition.delegate_report)).to eq true
    end

    it "can view delegate report for unposted report if board member delegate" do
      competition = FactoryGirl.create :competition, :with_delegate
      board_member = FactoryGirl.create :board_member

      expect(board_member.can_view_delegate_report?(competition.delegate_report)).to eq true
    end
  end
end
