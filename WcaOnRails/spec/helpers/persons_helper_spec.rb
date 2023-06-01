# frozen_string_literal: true

require "rails_helper"

RSpec.describe PersonsHelper do
  describe "#odd_rank_reason_if_needed" do
    describe "returns the odd message" do
      it "when country rank is missing" do
        rank_single = FactoryBot.create :ranks_single, country_rank: 0
        rank_average = FactoryBot.create :ranks_average
        expect(odd_rank_reason_needed?(rank_single, rank_average)).to eq true
      end

      it "when continent rank is missing" do
        rank_single = FactoryBot.create :ranks_single
        rank_average = FactoryBot.create :ranks_average, continent_rank: 0
        expect(odd_rank_reason_needed?(rank_single, rank_average)).to eq true
      end

      it "when country rank is greater than continent rank" do
        rank_single = FactoryBot.create :ranks_single, continent_rank: 10, country_rank: 1
        rank_average = FactoryBot.create :ranks_single, continent_rank: 10, country_rank: 50
        expect(odd_rank_reason_needed?(rank_single, rank_average)).to eq true
      end
    end
  end

  describe "#delegate_badge" do
    it "Returns a Delegate badge when passed delegate" do
      string = helper.delegate_badge("delegate")
      expect(string).to eq "<span class=\"badge delegate-badge\" data-toggle=\"tooltip\" " \
                           "data-placement=\"bottom\" title=\"" +
                           t("enums.user.delegate_status.delegate") +
                           "\"><a href=\"/delegates\">" +
                           t("enums.user.delegate_status.delegate") + "</a></span>"
    end

    it "Returns a Senior Delegate badge when passed senior_delegate" do
      string = helper.delegate_badge("senior_delegate")
      expect(string).to eq "<span class=\"badge delegate-badge\" data-toggle=\"tooltip\" " \
                           "data-placement=\"bottom\" title=\"" +
                           t("enums.user.delegate_status.senior_delegate") +
                           "\"><a href=\"/delegates\">" +
                           t("enums.user.delegate_status.senior_delegate") + "</a></span>"
    end

    it "Returns a Junior Delegate badge when passed candidate_delegate" do
      string = helper.delegate_badge("candidate_delegate")
      expect(string).to eq "<span class=\"badge delegate-badge\" data-toggle=\"tooltip\" " \
                           "data-placement=\"bottom\" title=\"" +
                           t("enums.user.delegate_status.candidate_delegate") +
                           "\"><a href=\"/delegates\">" +
                           t("enums.user.delegate_status.candidate_delegate") + "</a></span>"
    end

    it "Returns a Trainee Delegate badge when passed trainee_delegate" do
      string = helper.delegate_badge("trainee_delegate")
      expect(string).to eq "<span class=\"badge delegate-badge\" data-toggle=\"tooltip\" " \
                           "data-placement=\"bottom\" title=\"" +
                           t("enums.user.delegate_status.trainee_delegate") + "\">" +
                           t("enums.user.delegate_status.trainee_delegate") +
                           "</span>"
    end

    it "links to the delegates page" do
      string = helper.delegate_badge("delegate")
      expect(string).to include("href=\"/delegates\">")
    end
  end

  describe "#officer_badge" do
    it "Returns a Chair Badge when team is chair" do
      string = helper.officer_badge(Team.chair.name)
      expect(string).to eq "<span class=\"badge officer-badge\"><a title=\"WCA Officers\" " \
                           "data-toggle=\"tooltip\" data-placement=\"bottom\" href=\"/teams-committees#officers\">" +
                           t('about.structure.chair.name') + "</a></span>"
    end

    it "Returns a Vice Chair Badge when team is vice_chair" do
      string = helper.officer_badge(Team.vice_chair.name)
      expect(string).to eq "<span class=\"badge officer-badge\"><a title=\"WCA Officers\" " \
                           "data-toggle=\"tooltip\" data-placement=\"bottom\" href=\"/teams-committees#officers\">" +
                           t('about.structure.vice_chair.name') + "</a></span>"
    end

    it "Returns a Secretary Badge when team is secretary" do
      string = helper.officer_badge(Team.secretary.name)
      expect(string).to eq "<span class=\"badge officer-badge\"><a title=\"WCA Officers\" " \
                           "data-toggle=\"tooltip\" data-placement=\"bottom\" href=\"/teams-committees#officers\">" +
                           t('about.structure.secretary.name') + "</a></span>"
    end

    it "Returns an Executive Director Badge when team is executive_director" do
      string = helper.officer_badge(Team.executive_director.name)
      expect(string).to eq "<span class=\"badge officer-badge\"><a title=\"WCA Officers\" " \
                           "data-toggle=\"tooltip\" data-placement=\"bottom\" href=\"/teams-committees#officers\">" +
                           t('about.structure.executive_director.name') + "</a></span>"
    end

    it "Returns Treasurer Badge when Treasurer position is passed" do
      string = helper.officer_badge(t('about.structure.treasurer.name'))
      expect(string).to eq "<span class=\"badge officer-badge\"><a title=\"WCA Officers\" " \
                           "data-toggle=\"tooltip\" data-placement=\"bottom\" href=\"/teams-committees#officers\">" +
                           t('about.structure.treasurer.name') + "</a></span>"
    end

    it "links to the officers section on the teams-committees page" do
      string = helper.officer_badge(Team.chair.name)
      expect(string).to include("href=\"/teams-committees#officers\">")
    end
  end

  describe "#team_badge" do
    it "Returns a Leader badge when leader is passed" do
      string = helper.team_badge(Team.wst, "leader", "")
      expect(string).to include("team-leader-badge")
    end

    it "Returns a Senior Member badge when senior_member is passed" do
      string = helper.team_badge(Team.wst, "senior_member", "")
      expect(string).to include("team-senior_member-badge")
    end

    it "Returns a Member badge when member is passed" do
      string = helper.team_badge(Team.wst, "member", "")
      expect(string).to include("team-member-badge")
    end

    it "Returns extra text and team acronym in the badge when both are passed" do
      string = helper.team_badge(Team.wst, "leader", " " + t('about.structure.leader'))
      expect(string).to include(Team.wst.acronym + " " + t('about.structure.leader'))
    end

    it "links to the given team section on the teams-committees page" do
      string = helper.team_badge(Team.wst, "member", "")
      expect(string).to include("href=\"/teams-committees#WST\">")
    end
  end

  describe "#all_user_badges" do
    it "gives no badge if the user has no teams, committees, councils or delegate positions" do
      user_no_teams = FactoryBot.create(:user, name: "John Doe")
      string = all_user_badges(user_no_teams)
      expect(string).to eq ""
    end

    it "Returns as many badges as diferent teams the user is on" do
      busy_member = FactoryBot.create :user, name: "Feliks Park"
      FactoryBot.create(:team_member, team_id: Team.wec.id, user_id: busy_member.id, start_date: Date.today-1, team_senior_member: true)
      FactoryBot.create(:team_member, team_id: Team.wst.id, user_id: busy_member.id, start_date: Date.today-1, team_leader: true)
      string = all_user_badges(busy_member)
      expect(string).to include(Team.wec.acronym)
      expect(string).to include(Team.wst.acronym)
    end

    it "Returns as many officers positions as the user has" do
      officer_member = FactoryBot.create :user, :chair, :executive_director
      string = all_user_badges(officer_member)
      expect(string).to include(t('about.structure.executive_director.name'))
      expect(string).to include(t('about.structure.chair.name'))
    end

    it "Returns a delegate position to a delegate" do
      delegate = FactoryBot.create :delegate
      candidate_delegate = FactoryBot.create :candidate_delegate
      string = all_user_badges(delegate)
      expect(string).to include(t('enums.user.delegate_status.delegate'))
      string = all_user_badges(candidate_delegate)
      expect(string).to include(t('enums.user.delegate_status.candidate_delegate'))
    end

    it "returns different kinds of badges if the user has the requested positions" do
      busy_delegate = FactoryBot.create :user, :vice_chair, name: "Idoit all"
      FactoryBot.create(:team_member, team_id: Team.board.id, user_id: busy_delegate.id, start_date: Date.today-1)
      FactoryBot.create(:team_member, team_id: Team.wec.id, user_id: busy_delegate.id, start_date: Date.today-1)
      FactoryBot.create(:team_member, team_id: Team.wfc.id, user_id: busy_delegate.id, start_date: Date.today-1, team_leader: true)
      busy_delegate.delegate_status = "senior_delegate"
      string = all_user_badges(busy_delegate)
      expect(string).to include(t('enums.user.delegate_status.senior_delegate'))
      expect(string).to include(t('about.structure.vice_chair.name'))
      expect(string).to include(Team.wec.acronym)
      expect(string).to include(Team.wfc.acronym + " " + t('about.structure.leader'))
      expect(string).to include(Team.board.acronym)
    end
  end
end
