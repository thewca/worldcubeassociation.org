# frozen_string_literal: true
class InsertTeams < ActiveRecord::Migration
  def up
    execute "insert into teams \
             (id, slug, name, description, created_at, updated_at, committee_id) \
             values \
             (NULL, 'board-members', 'Board Members', \
             'This team lists the members of the WCA board.', \
             now(), now(), \
             (select id from committees where slug = 'wca-board'));"
    execute "insert into teams \
             (id, slug, name, description, created_at, updated_at, committee_id) \
             values (NULL, 'world-delegates', 'World Delegates', \
             'Delegates for official WCA competitions World Wide.', \
             now(), now(), \
             (select id from committees where slug = 'wca-delegates-committee'));"
    execute "insert into teams \
             (id, slug, name, description, created_at, updated_at, committee_id) \
             values \
             (NULL, 'africa', 'Africa', \
             'Delegates for official WCA competitions in Africa.', \
             now(), now(), \
             (select id from committees where slug = 'wca-delegates-committee'));"
    execute "insert into teams \
             (id, slug, name, description, created_at, updated_at, committee_id) \
             values (NULL, 'asia-far-east', 'Asia Far East', \
             'Delegates for official WCA competitions in Far East Asia.', \
             now(), now(), \
             (select id from committees where slug = 'wca-delegates-committee'));"
    execute "insert into teams \
             (id, slug, name, description, created_at, updated_at, committee_id) \
             values (NULL, 'asia-japan', 'Asia Japan', \
             'Delegates for official WCA competitions in Japan.', \
             now(), now(), \
             (select id from committees where slug = 'wca-delegates-committee'));"
    execute "insert into teams \
             (id, slug, name, description, created_at, updated_at, committee_id) \
             values (NULL, 'asia-south-east-india', 'Asia South East and India', \
             'Delegates for official WCA competitions in South East Asia.', \
             now(), now(), \
             (select id from committees where slug = 'wca-delegates-committee'));"
    execute "insert into teams \
             (id, slug, name, description, created_at, updated_at, committee_id) \
             values (NULL, 'europe-east-middle-east', 'Europe East and Middle East', \
             'Delegates for official WCA competitions in East Europe and Middle East.', \
             now(), now(), \
             (select id from committees where slug = 'wca-delegates-committee'));"
    execute "insert into teams \
             (id, slug, name, description, created_at, updated_at, committee_id) \
             values (NULL, 'europe-north-baltic-states', 'Europe North and Baltic States', \
             'Delegates for official WCA competitions in North Europe and Baltic States.', \
             now(), now(), \
             (select id from committees where slug = 'wca-delegates-committee'));"
    execute "insert into teams \
             (id, slug, name, description, created_at, updated_at, committee_id) \
             values (NULL, 'europe-west', 'Europe West', \
             'Delegates for official WCA competitions in Western Europe.', \
             now(), now(), \
             (select id from committees where slug = 'wca-delegates-committee'));"
    execute "insert into teams \
             (id, slug, name, description, created_at, updated_at, committee_id) \
             values (NULL, 'oceania', 'Oceania', \
             'Delegates for official WCA competitions in Oceania.', \
             now(), now(), \
             (select id from committees where slug = 'wca-delegates-committee'));"
    execute "insert into teams \
             (id, slug, name, description, created_at, updated_at, committee_id) \
             values (NULL, 'south-america-middle-america', 'South America and Middle America', \
             'Delegates for official WCA competitions in South America and Middle America.', \
             now(), now(), \
             (select id from committees where slug = 'wca-delegates-committee'));"
    execute "insert into teams \
             (id, slug, name, description, created_at, updated_at, committee_id) \
             values (NULL, 'usa-east-canada', 'USA East and Canada', \
             'Delegates for official WCA competitions in Eastern USA and Canada.', \
             now(), now(), \
             (select id from committees where slug = 'wca-delegates-committee'));"
    execute "insert into teams \
             (id, slug, name, description, created_at, updated_at, committee_id) \
             values (NULL, 'usa-west', 'USA West', \
             'Delegates for official WCA competitions in Western USA.', \
             now(), now(), \
             (select id from committees where slug = 'wca-delegates-committee'));"

    execute "update teams \
             set slug = 'results-team', \
             committee_id = (select id from committees where slug = 'wca-results-committee') where slug = 'results';"
    execute "update teams \
             set slug = 'software-team', \
             committee_id = (select id from committees where slug = 'wca-software-committee') where slug = 'software';"
    execute "update teams \
             set slug = 'disciplinary-team', \
             name = 'Disciplinary Team', \
             committee_id = (select id from committees where slug = 'wca-disciplinary-committee') where slug = 'wdc';"
    execute "update teams \
             set slug = 'regulations-team', \
             name = 'Regulations Team', \
             committee_id = (select id from committees where slug = 'wca-regulations-committee') where slug = 'wrc';"
  end

  def down
    execute "delete from teams \
              where committee_id = (select id from committees where slug = 'wca-delegates-committee');"
    execute "delete from teams \
              where committee_id = (select id from committees where slug = 'wca-board');"
    execute "update teams \
             set slug = 'results', \
             committee_id = NULL \
             where slug = 'results-team';"
    execute "update teams \
             set slug = 'software', \
             committee_id = NULL \
             where slug = 'software-team';"
    execute "update teams \
             set slug = 'wdc', \
             name = 'Disciplinary Committee', \
             committee_id = NULL \
             where slug = 'disciplinary-team';"
    execute "update teams \
             set slug = 'wrc', \
             name = 'Regulations Committee', \
             committee_id = NULL \
             where slug = 'regulations-team';"
  end
end
