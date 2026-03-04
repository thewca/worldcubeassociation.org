# frozen_string_literal: true

class NormalizePersonNameQuotesToAsciiApostrophe < ActiveRecord::Migration[8.1]
  def up
    Person.where("name REGEXP ?", "[’‘]").find_each do |person|
      new_name = person.name
                       .tr("’", "'")
                       .tr("‘", "'")

      next if new_name == person.name

      person.execute_edit_person_request("fix", { name: new_name })
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
