# frozen_string_literal: true
class UpdateTeamMembersWithPositions < ActiveRecord::Migration
  def update_existing_team_members
    execute "update team_members tm \
             set committee_position_id = \
               (select id \
                from committee_positions cp \
                where cp.committee_id = \
                 (select committee_id from teams t where t.id = tm.team_id) \
                and cp.slug = 'team-member') \
             where tm.team_leader = 0;"
    execute "update team_members tm \
             set committee_position_id = \
               (select id \
                from committee_positions cp \
                where cp.committee_id = \
                  (select committee_id from teams t where t.id = tm.team_id) \
                and cp.slug = 'team-leader') \
             where tm.team_leader = 1;"
  end

  def insert_board_members
    execute "insert into team_members \
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.id in (1, 14, 18) \
             and c.slug = 'wca-board' \
             and t.slug = 'board-members' \
             and cp.slug = 'board-member';"
  end

  def insert_world_delegates
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u where u.id in (1, 14, 18) \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'world-delegates' \
             and cp.slug = 'senior-delegate';"
  end

  def insert_africa_delegates
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.delegate_status = 'senior_delegate' \
             and u.id = 353 \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'africa' \
             and cp.slug = 'senior-delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 353 \
             and u.delegate_status = 'delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'africa' \
             and cp.slug = 'delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 353 \
             and u.delegate_status = 'candidate_delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'africa' \
             and cp.slug = 'candidate-delegate';"
  end

  def insert_far_east_asia_delegates
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.delegate_status = 'senior_delegate' \
             and u.id = 39 \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'asia-far-east' \
             and cp.slug = 'senior-delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 39 \
             and u.delegate_status = 'delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'asia-far-east' \
             and cp.slug = 'delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 39 \
             and u.delegate_status = 'candidate_delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'asia-far-east' \
             and cp.slug = 'candidate-delegate';"
  end

  def insert_japan_delegates
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.delegate_status = 'senior_delegate' \
             and u.id = 253 \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'asia-japan' \
             and cp.slug = 'senior-delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 253 \
             and u.delegate_status = 'delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'asia-japan' \
             and cp.slug = 'delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 253 \
             and u.delegate_status = 'candidate_delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'asia-japan' \
             and cp.slug = 'candidate-delegate';"
  end

  def insert_south_east_asia_delegates
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.delegate_status = 'senior_delegate' \
             and u.id = 251 \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'asia-south-east-india' \
             and cp.slug = 'senior-delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 251 \
             and u.delegate_status = 'delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'asia-south-east-india' \
             and cp.slug = 'delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u where u.senior_delegate_id = 251 \
             and u.delegate_status = 'candidate_delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'asia-south-east-india' \
             and cp.slug = 'candidate-delegate';"
  end

  def insert_east_europe_delegates
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u where u.delegate_status = 'senior_delegate' \
             and u.id = 250 \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'europe-east-middle-east' \
             and cp.slug = 'senior-delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 250 \
             and u.delegate_status = 'delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'europe-east-middle-east' \
             and cp.slug = 'delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 250 \
             and u.delegate_status = 'candidate_delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'europe-east-middle-east' \
             and cp.slug = 'candidate-delegate';"
  end

  def insert_north_europe_delegates
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.delegate_status = 'senior_delegate' \
             and u.id = 249 \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'europe-north-baltic-states' \
             and cp.slug = 'senior-delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 249 \
             and u.delegate_status = 'delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'europe-north-baltic-states' \
             and cp.slug = 'delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 249 \
             and u.delegate_status = 'candidate_delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'europe-north-baltic-states' \
             and cp.slug = 'candidate-delegate';"
  end

  def insert_western_europe_delegates
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.delegate_status = 'senior_delegate' \
             and u.id = 248 \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'europe-west' \
             and cp.slug = 'senior-delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 248 \
             and u.delegate_status = 'delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'europe-west' \
             and cp.slug = 'delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 248 \
             and u.delegate_status = 'candidate_delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'europe-west' \
             and cp.slug = 'candidate-delegate';"
  end

  def insert_oceania_delegates
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.delegate_status = 'senior_delegate' \
             and u.id = 12 \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'oceania' \
             and cp.slug = 'senior-delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 12 \
             and u.delegate_status = 'delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'oceania' \
             and cp.slug = 'delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 12 \
             and u.delegate_status = 'candidate_delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'oceania' \
             and cp.slug = 'candidate-delegate';"
  end

  def insert_south_america_delegates
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.delegate_status = 'senior_delegate' \
             and u.id = 247 \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'south-america-middle-america' \
             and cp.slug = 'senior-delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 247 \
             and u.delegate_status = 'delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'south-america-middle-america' \
             and cp.slug = 'delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 247 \
             and u.delegate_status = 'candidate_delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'south-america-middle-america' \
             and cp.slug = 'candidate-delegate';"
  end

  def insert_eastern_usa_delegates
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.delegate_status = 'senior_delegate' \
             and u.id = 4 \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'usa-east-canada' \
             and cp.slug = 'senior-delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 4 \
             and u.delegate_status = 'delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'usa-east-canada' \
             and cp.slug = 'delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 4 \
             and u.delegate_status = 'candidate_delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'usa-east-canada' \
             and cp.slug = 'candidate-delegate';"
  end

  def insert_western_usa_delegates
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.delegate_status = 'senior_delegate' \
             and u.id = 246 \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'usa-west' \
             and cp.slug = 'senior-delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 246 \
             and u.delegate_status = 'delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'usa-west' \
             and cp.slug = 'delegate';"
    execute "insert into team_members\
             (id, team_id, user_id, start_date, end_date, team_leader, created_at, updated_at, committee_position_id) \
             select NULL, t.id, u.id, '2003-01-01', NULL, 0, now(), now(), cp.id \
             from committee_positions cp \
             join committees c on c.id = cp.committee_id \
             join teams t on c.id = t.committee_id \
             cross join users u \
             where u.senior_delegate_id = 246 \
             and u.delegate_status = 'candidate_delegate' \
             and c.slug = 'wca-delegates-committee' \
             and t.slug = 'usa-west' \
             and cp.slug = 'candidate-delegate';"
  end

  def update_start_dates
    execute "update team_members tm \
             set start_date = ifnull(( \
                   select min(str_to_date(concat(c.year, '-', lpad(c.month, 2, '00'), '-', lpad(c.day, 2, '00')), '%Y-%m-%d')) start_date \
                   from Competitions c  \
                   join competition_delegates cd on cd.competition_id = c.id \
                   join users u on u.id = cd.delegate_id \
                   where u.id = tm.user_id \
                   and c.results_posted_at is not null \
                   group by u.id), now()), \
                 updated_at = now() \
             where tm.end_date is null \
             and   tm.team_id in \
                   (select t.id \
                    from teams t \
                    join committees cm on t.committee_id = cm.id \
                    where cm.slug = 'wca-delegates-committee');"

    execute "update team_members \
             set    start_date = now() \
             where  start_date = '0000-00-00';"
  end

  def up
    update_existing_team_members
    insert_board_members
    insert_world_delegates
    insert_africa_delegates
    insert_far_east_asia_delegates
    insert_japan_delegates
    insert_south_east_asia_delegates
    insert_east_europe_delegates
    insert_north_europe_delegates
    insert_western_europe_delegates
    insert_oceania_delegates
    insert_south_america_delegates
    insert_eastern_usa_delegates
    insert_western_usa_delegates
    update_start_dates
  end

  def down
    execute "update team_members set committee_position_id = NULL;"

    execute "delete from team_members \
              where team_id in (select id from teams where slug = 'board-members');"

    execute "delete from team_members \
              where team_id in (select t.id from teams t join committees c on c.id = t.committee_id  where c.slug = 'wca-delegates-committee');"
  end
end
