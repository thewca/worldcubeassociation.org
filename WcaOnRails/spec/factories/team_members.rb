# frozen_string_literal: true
FactoryGirl.define do
  factory :team_member do
    team
    user
    start_date 1.month.ago
    end_date nil
    committee_position do
      CommitteePosition.find_by_committee_id_and_slug(team.committee_id, 'team-member') || FactoryGirl.create(:committee_position, name: 'Team Member', committee: team.committee)
    end

    trait :candidate_delegate do
      team do
        Team.where("slug = :slug", slug: 'delegate-testing-team').first_or_create(name: 'Delegate Testing Team', description: 'For testing', committee: Committee.find_by_slug(Committee::WCA_DELEGATES_COMMITTEE))
      end
      committee_position do
        CommitteePosition.find_by_committee_id_and_slug(team.committee_id, 'candidate-delegate') || FactoryGirl.create(:committee_position, name: 'Candidate Delegate', committee: team.committee)
      end
    end

    trait :delegate do
      team do
        Team.where("slug = :slug", slug: 'delegate-testing-team').first_or_create(name: 'Delegate Testing Team', description: 'For testing', committee: Committee.find_by_slug(Committee::WCA_DELEGATES_COMMITTEE))
      end
      committee_position do
        CommitteePosition.find_by_committee_id_and_slug(team.committee_id, 'delegate') || FactoryGirl.create(:committee_position, name: 'Delegate', committee: team.committee)
      end
    end

    trait :senior_delegate do
      team do
        Team.where("slug = :slug", slug: 'delegate-testing-team').first_or_create(name: 'Delegate Testing Team', description: 'For testing', committee: Committee.find_by_slug(Committee::WCA_DELEGATES_COMMITTEE))
      end
      committee_position do
        CommitteePosition.find_by_committee_id_and_slug(team.committee_id, 'senior-delegate') || FactoryGirl.create(:committee_position, name: 'Senior Delegate', team_leader: true, committee: team.committee)
      end
    end

    trait :board_member do
      team do
        Team.find_by_slug('board-members') || FactoryGirl.create(:team, name: 'Board Members', committee: Committee.find_by_slug(Committee::WCA_BOARD))
      end
      committee_position do
        CommitteePosition.find_by_committee_id_and_slug(team.committee_id, 'board-member') || FactoryGirl.create(:committee_position, name: 'Board Member', team_leader: true, committee: team.committee)
      end
    end

    trait :software_team_leader do
      team do
        Team.find_by_slug('software-team') || FactoryGirl.create(:team, name: 'Software Team', committee: Committee.find_by_slug(Committee::WCA_SOFTWARE_COMMITTEE))
      end
      committee_position do
        CommitteePosition.find_by_committee_id_and_slug(team.committee_id, 'team-leader') || FactoryGirl.create(:committee_position, name: 'Team Leader', team_leader: true, committee: team.committee)
      end
    end

    trait :results_team_leader do
      team do
        Team.find_by_slug('results-team') || FactoryGirl.create(:team, name: 'Results Team', committee: Committee.find_by_slug(Committee::WCA_RESULTS_COMMITTEE))
      end
      committee_position do
        CommitteePosition.find_by_committee_id_and_slug(team.committee_id, 'team-leader') || FactoryGirl.create(:committee_position, name: 'Team Leader', team_leader: true, committee: team.committee)
      end
    end

    trait :regulations_team_leader do
      team do
        Team.find_by_slug('regulations-team') || FactoryGirl.create(:team, name: 'Regulations Team', committee: Committee.find_by_slug(Committee::WCA_REGULATIONS_COMMITTEE))
      end
      committee_position do
        CommitteePosition.find_by_committee_id_and_slug(team.committee_id, 'team-leader') || FactoryGirl.create(:committee_position, name: 'Team Leader', team_leader: true, committee: team.committee)
      end
    end

    trait :disciplinary_team_leader do
      team do
        Team.find_by_slug('disciplinary-team') || FactoryGirl.create(:team, name: 'Disciplinary Team', committee: Committee.find_by_slug(Committee::WCA_DISCIPLINARY_COMMITTEE))
      end
      committee_position do
        CommitteePosition.find_by_committee_id_and_slug(team.committee_id, 'team-leader') || FactoryGirl.create(:committee_position, name: 'Team Leader', team_leader: true, committee: team.committee)
      end
    end

    trait :team_leader do
      committee_position do
        FactoryGirl.create(:committee_position, team_leader: true, committee: team.committee)
      end
    end

    trait :demoted do
      start_date 2.years.ago
      end_date 2.months.ago
    end
  end
end
