# frozen_string_literal: true

class ChangeEventOrderAndNames < ActiveRecord::Migration
  def up
    # No change for Rubik's Cube event.
    execute <<-SQL
      update Events set name = '2x2x2 Cube', rank = 20 where id = '222';
    SQL
    execute <<-SQL
      update Events set name = '4x4x4 Cube', rank = 30 where id = '444';
    SQL
    execute <<-SQL
      update Events set name = '5x5x5 Cube', rank = 40 where id = '555';
    SQL
    execute <<-SQL
      update Events set name = '6x6x6 Cube', rank = 50 where id = '666';
    SQL
    execute <<-SQL
      update Events set name = '7x7x7 Cube', rank = 60 where id = '777';
    SQL
    execute <<-SQL
      update Events set name = '3x3x3 Blindfolded', rank = 70 where id = '333bf';
    SQL
    execute <<-SQL
      update Events set name = '3x3x3 Fewest Moves', rank = 80 where id = '333fm';
    SQL
    execute <<-SQL
      update Events set name = '3x3x3 One-Handed', rank = 90 where id = '333oh';
    SQL
    execute <<-SQL
      update Events set name = '3x3x3 With Feet', rank = 100 where id = '333ft';
    SQL
    # No changes in the names for these events, only the rank.
    execute <<-SQL
      update Events set rank = 110 where id = 'minx';
    SQL
    execute <<-SQL
      update Events set rank = 120 where id = 'pyram';
    SQL
    execute <<-SQL
      update Events set rank = 130 where id = 'clock';
    SQL
    execute <<-SQL
      update Events set rank = 140 where id = 'skewb';
    SQL
    execute <<-SQL
      update Events set rank = 150 where id = 'sq1';
    SQL
    execute <<-SQL
      update Events set name = '4x4x4 Blindfolded', rank = 160 where id = '444bf';
    SQL
    execute <<-SQL
      update Events set name = '5x5x5 Blindfolded', rank = 170 where id = '555bf';
    SQL
    execute <<-SQL
      update Events set name = '3x3x3 Multi-Blind', rank = 180 where id = '333mbf';
    SQL

    execute <<-SQL
      update Events set cellName = name;
    SQL
  end

  def down
  end
end
