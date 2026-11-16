# frozen_string_literal: true

require "rails_helper"

RSpec.describe WcaMonthlyDigest do
  subject(:digest) { WcaMonthlyDigest.new(period) }

  let(:period) { Date.new(2026, 3, 1).all_month }
  let(:before_period) { Date.new(2025, 6, 1) }
  let(:change_date) { Date.new(2026, 3, 15) }
  let(:after_period) { Date.new(2026, 4, 10) }
  let(:region) { GroupsMetadataDelegateRegions.find_by!(friendly_id: 'africa').user_group }
  let(:other_region) { GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia').user_group }
  let(:wrc) { UserGroup.teams_committees_group_wrc }
  # Delegate lines show the role's location, so the user's country is set to something else.
  let(:user) { create(:user_with_wca_id, country_iso2: "PL") }
  let(:location) { "Zimbabwe" }

  def change_role(old_role, new_role_factory, **new_role_attributes)
    old_role.update!(end_date: change_date)
    create(new_role_factory, user: old_role.user, start_date: change_date, **new_role_attributes)
  end

  describe "Delegate changes" do
    it "lists newly appointed Trainee Delegates with their WCA ID and location" do
      create(:trainee_delegate_role, user: user, start_date: change_date)

      expect(digest.new_trainee_delegates).to eq ["#{user.name} (#{user.wca_id}), #{location}"]
      expect(digest.new_junior_delegates).to be_empty
    end

    it "lists Trainee to Junior and Junior to Delegate promotions separately" do
      trainee_role = create(:trainee_delegate_role, user: user, start_date: before_period)
      change_role(trainee_role, :junior_delegate_role)
      junior_delegate = create(:user_with_wca_id, country_iso2: "PL")
      junior_role = create(:junior_delegate_role, user: junior_delegate, start_date: before_period)
      change_role(junior_role, :delegate_role)

      expect(digest.trainee_to_junior_delegate_promotions).to eq ["#{user.name}, #{location}"]
      expect(digest.junior_delegate_to_delegate_promotions).to eq ["#{junior_delegate.name}, #{location}"]
      expect(digest.new_junior_delegates).to be_empty
    end

    it "lists Delegates who stepped down with their number of delegated competitions" do
      create(:delegate_role, user: user, start_date: before_period, end_date: change_date)
      create_list(:competition, 2, starts: before_period, ends: before_period, delegates: [user], organizers: [user], show_at_all: true)

      expect(digest.delegate_resignations_and_demotions).to eq ["#{user.name}, #{location}, 2 delegated competitions"]
    end

    it "lists demoted Delegates under resignations and demotions" do
      delegate_role = create(:delegate_role, user: user, start_date: before_period)
      change_role(delegate_role, :junior_delegate_role)

      expect(digest.delegate_resignations_and_demotions).to eq ["#{user.name}, #{location}, demoted to Junior Delegate"]
    end

    it "does not list Senior or Regional Delegates stepping down from their lead role" do
      senior_delegate_role = create(:senior_delegate_role, user: user, start_date: before_period)
      change_role(senior_delegate_role, :regional_delegate_role)
      regional_delegate_role = create(:regional_delegate_role, start_date: before_period)
      change_role(regional_delegate_role, :delegate_role)

      expect(digest.delegate_resignations_and_demotions).to be_empty
    end

    it "names the Regional Delegate who stepped down for the same region" do
      previous_regional_delegate_role = create(:regional_delegate_role, start_date: before_period, group: region)
      change_role(previous_regional_delegate_role, :delegate_role, group: region)
      delegate_role = create(:delegate_role, user: user, start_date: before_period, group: region)
      change_role(delegate_role, :regional_delegate_role, group: region)

      expect(digest.new_regional_delegates).to eq [
        "#{user.name} has been appointed as the new Regional Delegate for the #{region.name} region, " \
        "as #{previous_regional_delegate_role.user.name} stepped down from this role.",
      ]
    end

    it "omits the predecessor when no Regional Delegate of that region stepped down" do
      other_regional_delegate_role = create(:regional_delegate_role, start_date: before_period, group: other_region)
      change_role(other_regional_delegate_role, :delegate_role, group: other_region)
      create(:regional_delegate_role, user: user, start_date: change_date, group: region)

      expect(digest.new_regional_delegates).to eq ["#{user.name} has been appointed as the new Regional Delegate for the #{region.name} region."]
    end

    it "lists new Senior Delegates with their region" do
      regional_delegate_role = create(:regional_delegate_role, user: user, start_date: before_period, group: region)
      change_role(regional_delegate_role, :senior_delegate_role, group: region)

      expect(digest.new_senior_delegates).to eq ["#{user.name} - #{region.name}"]
    end

    it "ignores a Delegate moving to another region with the same status" do
      delegate_role = create(:delegate_role, user: user, start_date: before_period, group: region)
      change_role(delegate_role, :delegate_role, group: other_region)

      expect(digest.delegate_resignations_and_demotions).to be_empty
    end

    it "ignores a role that started and ended within the month" do
      create(:trainee_delegate_role, user: user, start_date: period.begin, end_date: change_date)

      expect(digest.new_trainee_delegates).to be_empty
      expect(digest.delegate_resignations_and_demotions).to be_empty
    end

    it "ignores changes outside of the month" do
      create(:trainee_delegate_role, user: user, start_date: after_period)
      create(:delegate_role, start_date: before_period, end_date: after_period)

      expect(digest.new_trainee_delegates).to be_empty
      expect(digest.delegate_resignations_and_demotions).to be_empty
    end
  end

  describe "Committee/Team changes" do
    it "announces a new Leader and the Leader who stepped down" do
      leader_role = create(:wrc_leader_role, user: user, start_date: before_period)
      change_role(leader_role, :wrc_senior_member_role)
      member_role = create(:wrc_member_role, start_date: before_period)
      change_role(member_role, :wrc_leader_role)

      expect(digest.leader_changes).to contain_exactly(
        "#{member_role.user.name} was appointed as the new #{wrc.name} Leader.",
        "#{user.name} is no longer the #{wrc.name} Leader, but will continue as Senior Member.",
      )
      expect(digest.promoted_team_members).to be_empty
      expect(digest.team_member_resignations_and_demotions).to be_empty
    end

    it "lists new members and marks new Senior Members" do
      create(:wrc_member_role, user: user, start_date: change_date)
      senior_member_role = create(:wrc_senior_member_role, start_date: change_date)

      expect(digest.new_team_members).to contain_exactly(
        "#{user.name}, #{wrc.name}",
        "#{senior_member_role.user.name}, #{wrc.name} (Senior Member)",
      )
    end

    it "lists members promoted to Senior Member" do
      member_role = create(:wrc_member_role, user: user, start_date: before_period)
      change_role(member_role, :wrc_senior_member_role)

      expect(digest.promoted_team_members).to eq ["#{user.name}, #{wrc.name}"]
      expect(digest.new_team_members).to be_empty
    end

    it "lists members who left and Senior Members who were demoted" do
      create(:wrc_member_role, user: user, start_date: before_period, end_date: change_date)
      senior_member_role = create(:wrc_senior_member_role, start_date: before_period)
      change_role(senior_member_role, :wrc_member_role)

      expect(digest.team_member_resignations_and_demotions).to contain_exactly(
        "#{user.name}, #{wrc.name}",
        "#{senior_member_role.user.name}, #{wrc.name}, demoted to Member",
      )
    end
  end

  describe "#recognized_regional_organizations" do
    it "lists Regional Organizations recognized during the month" do
      create(:regional_organization, name: "Cubing Recognized", country: "Poland", start_date: change_date)
      create(:regional_organization, name: "Cubing Earlier", country: "Poland", start_date: before_period)

      expect(digest.recognized_regional_organizations).to eq ["Cubing Recognized, Poland"]
    end
  end
end
