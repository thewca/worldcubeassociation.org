# frozen_string_literal: true

class CopyNamesFromPersonsToUsers < ActiveRecord::Migration
  def up
    execute "UPDATE users INNER JOIN Persons ON users.wca_id=Persons.id SET users.name=Persons.name"
  end
end
