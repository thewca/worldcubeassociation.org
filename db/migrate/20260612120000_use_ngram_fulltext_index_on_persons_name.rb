# frozen_string_literal: true

class UseNgramFulltextIndexOnPersonsName < ActiveRecord::Migration[8.1]
  # Replace the word-prefix FULLTEXT index on persons.name with one that uses the
  # ngram parser, so person search can match substrings mid-word (e.g. "koy" finds
  # "Akoy Gregory") while still being index-backed instead of a `LIKE '%...%'` scan.
  def up
    remove_index :persons, name: "index_persons_on_name"
    execute <<~SQL.squish
      CREATE FULLTEXT INDEX index_persons_on_name ON persons (name) WITH PARSER ngram
    SQL
  end

  def down
    remove_index :persons, name: "index_persons_on_name"
    add_index :persons, :name, type: :fulltext, name: "index_persons_on_name"
  end
end