# frozen_string_literal: true

class ReferenceTableUpdates < ActiveRecord::Migration
  def up
    change_table :Rounds do |t|
      t.boolean :final, null: false
    end

    Round.where(id: ['c', 'f']).update_all(final: 1)
    Round.where.not(id: ['c', 'f']).update_all(final: 0)

    change_table :Formats do |t|
      t.string :sort_by, null: false
      t.string :sort_by_second, null: false
      t.integer :expected_solve_count, null: false
      t.integer :trim_fastest_n, null: false
      t.integer :trim_slowest_n, null: false
    end

    Format.where(id: '1').update_all(sort_by: 'single', sort_by_second: 'average', expected_solve_count: 1, trim_fastest_n: 0, trim_slowest_n: 0)
    Format.where(id: '2').update_all(sort_by: 'single', sort_by_second: 'average', expected_solve_count: 2, trim_fastest_n: 0, trim_slowest_n: 0)
    Format.where(id: '3').update_all(sort_by: 'single', sort_by_second: 'average', expected_solve_count: 3, trim_fastest_n: 0, trim_slowest_n: 0)
    Format.where(id: 'a').update_all(sort_by: 'average', sort_by_second: 'single', expected_solve_count: 5, trim_fastest_n: 1, trim_slowest_n: 1)
    Format.where(id: 'm').update_all(sort_by: 'average', sort_by_second: 'single', expected_solve_count: 3, trim_fastest_n: 0, trim_slowest_n: 0)

    create_table :preferred_formats, id: false do |t|
      t.string :event_id, null: false
      t.string :format_id, null: false
      t.integer :ranking, null: false
    end
    add_foreign_key :preferred_formats, :Events, column: :event_id
    add_foreign_key :preferred_formats, :Formats, column: :format_id
    add_index :preferred_formats, [:event_id, :format_id], unique: true

    load 'db/seeds/preferred_formats.seeds.rb'
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
