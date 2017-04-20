# frozen_string_literal: true

class AllowNullGender < ActiveRecord::Migration[5.0]
  def up
    change_column_null :InboxPersons, :gender, true
    execute "UPDATE InboxPersons SET gender=NULL WHERE gender=''"

    change_column_null :Persons, :gender, true
    execute "UPDATE Persons SET gender=NULL WHERE gender=''"
  end

  def down
    change_column_null :Persons, :gender, false, ""
    change_column_null :InboxPersons, :gender, false, ""
  end
end
