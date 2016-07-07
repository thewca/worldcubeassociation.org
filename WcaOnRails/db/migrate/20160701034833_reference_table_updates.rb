# frozen_string_literal: true
class ReferenceTableUpdates < ActiveRecord::Migration
  def up
    change_table :Rounds do |t|
      t.boolean :final, null: false
    end

    ActiveRecord::Base.connection.execute("update Rounds set final = 1 where id in ('c', 'f');")
    ActiveRecord::Base.connection.execute("update Rounds set final = 0 where id not in ('c', 'f');")

    change_table :Formats do |t|
      t.string :sort_by, limit: 10, null: false
      t.string :sort_by_second, limit: 10, null: false
      t.integer :expected_solve_count, null: false
      t.integer :trim_fastest_n, null: false
      t.integer :trim_slowest_n, null: false
    end

    ActiveRecord::Base.connection.execute("update Formats set sort_by = 'single', sort_by_second = 'average', expected_solve_count = 1, trim_fastest_n = 0, trim_slowest_n = 0 where id = '1';")
    ActiveRecord::Base.connection.execute("update Formats set sort_by = 'single', sort_by_second = 'average', expected_solve_count = 2 where id = '2';")
    ActiveRecord::Base.connection.execute("update Formats set sort_by = 'single', sort_by_second = 'average', expected_solve_count = 3 where id = '3';")
    ActiveRecord::Base.connection.execute("update Formats set sort_by = 'average', sort_by_second = 'single', expected_solve_count = 5, trim_fastest_n = 1, trim_slowest_n = 1 where id = 'a';")
    ActiveRecord::Base.connection.execute("update Formats set sort_by = 'average', sort_by_second = 'single', expected_solve_count = 3, trim_fastest_n = 0, trim_slowest_n = 0 where id = 'm';")

    create_table :preferred_formats, id: false do |t|
      t.string :event_id, limit: 6, null: false
      t.string :format_id, limit: 1, null: false
      t.integer :ranking, null: false
    end
    add_foreign_key :preferred_formats, :Events, column: :event_id
    add_foreign_key :preferred_formats, :Formats, column: :format_id
    add_index :preferred_formats, [:event_id, :format_id], unique: true

    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('333', 'a', 1), ('333', '3', 2), ('333', '2', 3), ('333', '1', 4);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('444', 'a', 1), ('444', '3', 2), ('444', '2', 3), ('444', '1', 4);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('555', 'a', 1), ('555', '3', 2), ('555', '2', 3), ('555', '1', 4);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('222', 'a', 1), ('222', '3', 2), ('222', '2', 3), ('222', '1', 4);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('333bf', '3', 1), ('333bf', '2', 2), ('333bf', '1', 3);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('333oh', 'a', 1), ('333oh', '3', 2), ('333oh', '2', 3), ('333oh', '1', 4);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('333fm', 'm', 1), ('333fm', '2', 2), ('333fm', '1', 3);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('333ft', 'm', 1), ('333ft', '2', 2), ('333ft', '1', 3);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('minx', 'a', 1), ('minx', '3', 2), ('minx', '2', 3), ('minx', '1', 4);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('pyram', 'a', 1), ('pyram', '3', 2), ('pyram', '2', 3), ('pyram', '1', 4);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('sq1', 'a', 1), ('sq1', '3', 2), ('sq1', '2', 3), ('sq1', '1', 4);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('clock', 'a', 1), ('clock', '3', 2), ('clock', '2', 3), ('clock', '1', 4);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('skewb', 'a', 1), ('skewb', '3', 2), ('skewb', '2', 3), ('skewb', '1', 4);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('666', 'm', 1), ('666', '2', 2), ('666', '1', 3);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('777', 'm', 1), ('777', '2', 2), ('777', '1', 3);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('444bf', '3', 1), ('444bf', '2', 2), ('444bf', '1', 3);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('555bf', '3', 1), ('555bf', '2', 2), ('555bf', '1', 3);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('333mbf', '3', 1), ('333mbf', '2', 2), ('333mbf', '1', 3);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('magic', 'a', 1);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('mmagic', 'a', 1);")
    ActiveRecord::Base.connection.execute("insert into preferred_formats (event_id, format_id, ranking) values ('333mbo', 'a', 1);")
  end

  def down
    change_table :Formats do |t|
      t.remove :sort_by, :sort_by_second, :expected_solve_count, :trim_fastest_n, :trim_slowest_n
    end

    change_table :Rounds do |t|
      t.remove :final
    end

    drop_table :preferred_formats
  end
end
