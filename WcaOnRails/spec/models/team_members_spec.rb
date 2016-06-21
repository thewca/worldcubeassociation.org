require 'rails_helper'

describe TeamMember do
  it "has a valid factory" do
    expect(FactoryGirl.build(:team_member)).to be_valid
  end

  it "ensures start date is before end date" do
    team_member = FactoryGirl.build :team_member, start_date: 1.day.ago, end_date: 2.days.ago
    expect(team_member).to be_invalid
    expect(team_member.errors.messages[:start_date]).to eq ["must be earlier than end date"]
  end

  it "ensures the position is from the committee this membership is associated with" do
    unrelated_committee_position = FactoryGirl.create :committee_position
    team_member = FactoryGirl.build :team_member
    team_member.update_attributes(committee_position_id: unrelated_committee_position.id)
    expect(team_member).to be_invalid
    expect(team_member.errors.messages[:committee_position_id]).to eq ["must be a position from the committee this team member is part of"]
  end

  it "ensures a senior delegate is recognised by the model" do
    team_member = FactoryGirl.create :team_member, :senior_delegate
    expect(team_member.senior_delegate?).to eq true
  end

  it "ensures a user cannot have overlapping memberships to a single team" do
    team_member = FactoryGirl.create :team_member
    team_member2 = FactoryGirl.build :team_member, user_id: team_member.user_id, team_id: team_member.team_id, committee_position_id: team_member.committee_position_id
    expect(team_member2).to be_invalid
    expect(team_member2.errors.messages[:user_id]).to eq ["must not have overlapping membership dates with the #{team_member.team.name}."]
  end

  it "can add 2 memberships to a single team with non overlapping dates" do
    team_member = FactoryGirl.create :team_member, start_date: 9.months.ago, end_date: 6.months.ago
    team_member2 = FactoryGirl.build :team_member, start_date: 3.months.ago, user_id: team_member.user_id, team_id: team_member.team_id, committee_position_id: team_member.committee_position_id
    expect(team_member2).to be_valid
  end

  context "when adding members to a delegate team" do
    it "ensures the first member added is a senior delegate" do
      delegates_committee = Committee.find_by_slug(Committee::WCA_DELEGATES_COMMITTEE)
      delegate_team = Team.where("slug = :slug", slug: 'delegate-testing-team', committee_id: delegates_committee.id).first_or_create(name: 'Delegate Testing Team', description: 'For testing', committee_id: delegates_committee.id)
      team_member = FactoryGirl.build :team_member, :delegate, team_id: delegate_team.id
      expect(team_member).to be_invalid
      expect(team_member.errors.messages[:committee_position_id]).to eq ["must have one senior delegate for each delegate team. If you are demoting this member, create a new senior delegate first."]
    end

    it "ensures you cannot demote a senior delegate if they are the only one" do
      delegates_committee = Committee.find_by_slug(Committee::WCA_DELEGATES_COMMITTEE)
      delegate_team = Team.where("slug = :slug", slug: 'delegate-testing-team').first_or_create(name: 'Delegate Testing Team', description: 'For testing', committee_id: delegates_committee.id)
      team_member = FactoryGirl.create :team_member, :senior_delegate, team_id: delegate_team.id
      expect(team_member).to be_valid
      team_member.update_attributes(end_date: 1.day.ago)
      expect(team_member).to be_invalid
      expect(team_member.errors.messages[:committee_position_id]).to eq ["must have one senior delegate for each delegate team. If you are demoting this member, create a new senior delegate first."]
    end

    it "ensures you can demote a senior delegate if there is another" do
      delegates_committee = Committee.find_by_slug(Committee::WCA_DELEGATES_COMMITTEE)
      delegate_team = Team.where("slug = :slug", slug: 'delegate-testing-team').first_or_create(name: 'Delegate Testing Team', description: 'For testing', committee_id: delegates_committee.id)
      team_member1 = FactoryGirl.create :team_member, :senior_delegate, team_id: delegate_team.id
      FactoryGirl.create :team_member, :senior_delegate, team_id: delegate_team.id
      team_member1.update_attributes(end_date: 1.day.ago)
      expect(team_member1).to be_valid
    end
  end
end
