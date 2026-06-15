# frozen_string_literal: true

# The `WITH PARSER ngram` clause on the persons.name FULLTEXT index (added by the
# UseNgramFulltextIndexOnPersonsName migration) cannot be represented in Rails'
# Ruby schema dumper, so the schema-loaded test DB gets a plain word index instead.
# That makes substring person search (e.g. "koy" -> "Akoy") behave differently in
# tests than in production. Tag a context with `:ngram_person_index` to rebuild the
# real ngram index before those examples run.
module NgramPersonIndex
  module_function

  def recreate!
    conn = ActiveRecord::Base.connection
    # Stopwords OFF so ngram bigrams like "la"/"en" are not dropped; see the
    # UseNgramFulltextIndexOnPersonsName migration for the full rationale. The
    # setting is read (and baked into the index) at CREATE time on this connection.
    conn.execute("SET SESSION innodb_ft_enable_stopword = OFF")
    conn.execute("ALTER TABLE persons DROP INDEX index_persons_on_name")
    conn.execute("CREATE FULLTEXT INDEX index_persons_on_name ON persons (name) WITH PARSER ngram")
  end
end

RSpec.configure do |config|
  # Rebuild per example, not per context: DatabaseCleaner truncates persons between
  # examples and TRUNCATE rebuilds the FULLTEXT index (reverting it to a stopword
  # word index), so a once-per-context rebuild would go stale after the first
  # truncation. This hook runs after DatabaseCleaner.start, so the table is clean;
  # rows created afterwards by `let!` are indexed by the freshly-built ngram index.
  config.before(:each, :ngram_person_index) do
    NgramPersonIndex.recreate!
  end
end
