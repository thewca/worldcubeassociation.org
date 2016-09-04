# frozen_string_literal: true
class ReferenceTableUpdates < ActiveRecord::Migration
  def up
    change_table :Rounds do |t|
      t.boolean :final, null: false
    end

    Round.where(id: ['c', 'f']).update_all(final: 1)
    Round.where.not(id: ['c', 'f']).update_all(final: 0)

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

    { "333" => %(a 3 2 1),
      "444" => %(a 3 2 1),
      "555" => %(a 3 2 1),
      "222" => %(a 3 2 1),
      "333bf" => %(3 2 1),
      "333oh" => %(a 3 2 1),
      "333fm" => %(m 2 1),
      "333ft" => %(m 2 1),
      "minx" => %(a 3 2 1),
      "pyram" => %(a 3 2 1),
      "sq1" => %(a 3 2 1),
      "clock" => %(a 3 2 1),
      "skewb" => %(a 3 2 1),
      "666" => %(m 2 1),
      "777" => %(m 2 1),
      "444bf" => %(3 2 1),
      "555bf" => %(3 2 1),
      "333mbf" => %(3 2 1),
      "magic" => %(a),
      "mmagic" => %(a),
      "333mbo" => %(a),
    }.each do |event_id, format_ids|
      format_ids.each_with_index do |format_id, i|
        Format.create(event_id: event_id, format_id: format_id, ranking: (i + 1))
      end
    end
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
