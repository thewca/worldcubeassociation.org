class InsertCommittees < ActiveRecord::Migration
  def up
    execute <<-SQL
      insert into committees
      (id, name, slug, duties, email, created_at, updated_at)
      values
      (NULL, 'WCA Board', 'wca-board',
      'Responsible for the governance of the WCA.',
      'board@worldcubeassociation.org', now(), now());
    SQL
    execute <<-SQL
      insert into committees
      (id, name, slug, duties, email, created_at, updated_at)
      values
      (NULL, 'WCA Delegates Committee', 'wca-delegates-committee',
      '**WCA Delegates** are members of the WCA who are responsible for making sure that all WCA competitions are run according to the mission, regulations and spirit of the WCA. The WCA distinguishes between **WCA Senior Delegates, WCA Delegates and WCA Candidate Delegates.** Additional to the duties of a WCA Delegate, a WCA Senior Delegate is responsible for managing the Delegates in their area and can also be contacted by the community for regional matters. New Delegates are at first listed as WCA Candidate Delegates and need to show that they are capable of managing competitions successfully before being listed as WCA Delegates.',
      'delegates@worldcubeassociation.org', now(), now());
    SQL
    execute <<-SQL
      insert into committees
      (id, name, slug, duties, email, created_at, updated_at)
      values
      (NULL, 'WCA Regulations Committee', 'wca-regulations-committee',
      'This committee is responsible for managing the WCA Regulations.',
      'wrc@worldcubeassociation.org', now(), now());
    SQL
    execute <<-SQL
      insert into committees
      (id, name, slug, duties, email, created_at, updated_at)
      values
      (NULL, 'WCA Results Committee', 'wca-results-committee',
      'This team is responsible for managing all competition results.',
      'results@worldcubeassociation.org', now(), now());
    SQL
    execute <<-SQL
      insert into committees
      (id, name, slug, duties, email, created_at, updated_at)
      values
      (NULL, 'WCA Software Committee', 'wca-software-committee',
      'This team is responsible for managing the WCA''s software (website, scramblers, workbooks, admin tools).',
      'software@worldcubeassociation.org', now(), now());
    SQL
  end

  def down
    execute "truncate table committees;"
  end
end
