class CreateExpiredDelegates < ActiveRecord::Migration
  def up
    execute "insert into team_members \
             (id, team_id, user_id, start_date, end_date, created_at, updated_at, committee_position_id) \
             select NULL, \
                    (select id from teams where slug = 'world-delegates'), \
                    u.id, \
                    min(str_to_date(concat(c.year, '-', lpad(c.month, 2, '00'), '-', lpad(c.day, 2, '00')), '%Y-%m-%d')) start_date, \
                    max(str_to_date(concat(c.year, '-', lpad(c.endMonth, 2, '00'), '-', lpad(c.endDay, 2, '00')), '%Y-%m-%d')) end_date, \
                    now(), \
                    now(), \
                    (select id from committee_positions where slug = 'delegate') \
             from Competitions c \
             join competition_delegates cd on cd.competition_id = c.id \
             join users u on u.id = cd.delegate_id \
             where u.id not in \
                 (select user_id \
                  from team_members tm  \
                  join teams t on tm.team_id = t.id \
                  join committees c on c.id = t.committee_id \
                  where c.slug = 'wca-delegates-committee') \
             group by u.id"
  end

  def down
    execute "delete \
             from team_members \
             where team_id in \
                   (select id from teams where slug = 'world-delegates') \
             and end_date is not null"
  end
end
