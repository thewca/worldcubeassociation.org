# frozen_string_literal: true

class RemoveRubiks < ActiveRecord::Migration[5.1]
  def change
    execute <<-SQL
      update Events set name = '3x3x3 Cube' where id = '333';
    SQL
    execute <<-SQL
      update Events set name = 'Clock', rank = 110 where id = 'clock';
    SQL
    execute <<-SQL
      update Events set  rank = 120 where id = 'minx';
    SQL
    execute <<-SQL
      update Events set rank = 130 where id = 'pyram';
    SQL
    execute <<-SQL
      update Events set name = '3x3x3 Multi-Blind Old Style' where id = '333mbo';
    SQL

    execute <<-SQL
      update Events set cellName = name;
    SQL
  end
end
