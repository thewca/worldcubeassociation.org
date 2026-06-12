# frozen_string_literal: true

class UseNgramFulltextIndexOnPersonsName < ActiveRecord::Migration[8.1]
  # Replace the word-prefix FULLTEXT index on persons.name with one that uses the
  # ngram parser, so person search can match substrings mid-word (e.g. "koy" finds
  # "Akoy Gregory") while still being index-backed instead of a `LIKE '%...%'` scan.
  #
  # Stopwords are disabled for this index: InnoDB's default stopword list contains
  # common bigrams ("la", "en", "de", "on", ...), and the ngram parser would drop
  # those tokens, breaking searches like "Law" (la + aw). The stopword setting is
  # read at index-build time and baked into the index, so this needs no query-time
  # changes. Toggling it is safe because it only affects FULLTEXT index builds.
  def up
    remove_index :persons, name: "index_persons_on_name"
    execute "SET SESSION innodb_ft_enable_stopword = OFF"
    execute <<~SQL.squish
      CREATE FULLTEXT INDEX index_persons_on_name ON persons (name) WITH PARSER ngram
    SQL
  ensure
    execute "SET SESSION innodb_ft_enable_stopword = ON"
  end

  def down
    remove_index :persons, name: "index_persons_on_name"
    add_index :persons, :name, type: :fulltext, name: "index_persons_on_name"
  end
end