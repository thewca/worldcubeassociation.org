class InsertCommitteePositions < ActiveRecord::Migration
  def up
    execute "insert into committee_positions \
             (id, name, slug, description, team_leader, committee_id, created_at, updated_at) \
             values \
             (NULL, 'Board Member', 'board-member', \
             'Board members are responsible for governing the WCA.', 1, \
             (select id from committees where slug = 'wca-board')\
             , now(), now());"

    execute "insert into committee_positions \
             (id, name, slug, description, team_leader, committee_id, created_at, updated_at) \
             values \
             (NULL, 'Candidate Delegate', 'candidate-delegate', \
             'New Delegates are at first listed as WCA Candidate Delegates and need \
             to show that they are capable of managing competitions successfully before \
             being listed as WCA Delegates.', \
             0, \
             (select id from committees where slug = 'wca-delegates-committee')\
             , now(), now());"

    execute "insert into committee_positions \
             (id, name, slug, description, team_leader, committee_id, created_at, updated_at) \
             values \
             (NULL, 'Delegate', 'delegate', \
             'WCA Delegates are members of the WCA who are responsible for making sure \
             that all WCA competitions are run according to the mission, regulations \
             and spirit of the WCA.', \
             0, \
             (select id from committees where slug = 'wca-delegates-committee'), \
             now(), now());"

    execute "insert into committee_positions \
             (id, name, slug, description, team_leader, committee_id, created_at, updated_at) \
             values \
             (NULL, 'Senior Delegate', 'senior-delegate', \
             'Additional to the duties of a WCA Delegate, a WCA Senior Delegate is \
             responsible for managing the Delegates in their area and can also be \
             contacted by the community for regional matters.', \
             1, \
             (select id from committees where slug = 'wca-delegates-committee'), \
             now(), now());"

    execute "insert into committee_positions \
             (id, name, slug, description, team_leader, committee_id, created_at, updated_at) \
             values \
             (NULL, 'Team Leader', 'team-leader', \
             'Leader for this team as part of the disciplinary committee.', \
             1, \
             (select id from committees where slug = 'wca-disciplinary-committee'), \
             now(), now());"

    execute "insert into committee_positions \
             (id, name, slug, description, team_leader, committee_id, created_at, updated_at) \
             values \
             (NULL, 'Team Member', 'team-member', \
             'Regular member of this team as part of the disciplinary committee.', \
             0, \
             (select id from committees where slug = 'wca-disciplinary-committee'), \
             now(), now());"

    execute "insert into committee_positions \
             (id, name, slug, description, team_leader, committee_id, created_at, updated_at) \
             values \
             (NULL, 'Team Leader', 'team-leader', \
             'Leader for this team as part of the regulations committee.', \
             1, \
             (select id from committees where slug = 'wca-regulations-committee'), \
             now(), now());"

    execute "insert into committee_positions \
             (id, name, slug, description, team_leader, committee_id, created_at, updated_at) \
             values \
             (NULL, 'Team Member', 'team-member', \
             'Regular member of this team as part of the regulations committee.', \
             0, \
             (select id from committees where slug = 'wca-regulations-committee'), \
             now(), now());"

    execute "insert into committee_positions \
             (id, name, slug, description, team_leader, committee_id, created_at, updated_at) \
             values \
             (NULL, 'Team Leader', 'team-leader', \
             'Leader for this team as part of the results committee.', \
             1, \
             (select id from committees where slug = 'wca-results-committee'), \
             now(), now());"

    execute "insert into committee_positions \
             (id, name, slug, description, team_leader, committee_id, created_at, updated_at) \
             values \
             (NULL, 'Team Member', 'team-member', \
             'Regular member of this team as part of the results committee.', \
             0, \
             (select id from committees where slug = 'wca-results-committee'), \
             now(), now());"

    execute "insert into committee_positions \
             (id, name, slug, description, team_leader, committee_id, created_at, updated_at) \
             values \
             (NULL, 'Team Leader', 'team-leader', \
             'Leader for this team as part of the software committee.', \
             1, \
             (select id from committees where slug = 'wca-software-committee'), \
             now(), now());"

    execute "insert into committee_positions \
             (id, name, slug, description, team_leader, committee_id, created_at, updated_at) \
             values (NULL, 'Team Member', 'team-member', \
             'Regular member of this team as part of the software committee.', \
             0, \
             (select id from committees where slug = 'wca-software-committee'), \
             now(), now());"

    execute "insert into committee_positions \
             (id, name, slug, description, team_leader, committee_id, created_at, updated_at) \
             values \
             (NULL, 'Candidate Member', 'candidate-member', \
             'Candidate member of this team as part of the software committee.', \
             0, \
             (select id from committees where slug = 'wca-software-committee'), \
             now(), now());"
  end

  def down
    execute "delete from committee_positions"
  end
end
