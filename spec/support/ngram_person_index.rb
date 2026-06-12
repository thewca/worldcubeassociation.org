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
    # UseNgramFulltextIndexOnPersonsName migration for the full rationale. We leave
    # the session setting OFF (rather than resetting it) on purpose: DatabaseCleaner
    # truncates persons between examples, and TRUNCATE rebuilds the FULLTEXT index
    # re-reading this setting -- if it were ON again the index would revert to
    # stopword behavior and substring searches like "Law" would start failing.
    conn.execute("SET SESSION innodb_ft_enable_stopword = OFF")
    conn.execute("ALTER TABLE persons DROP INDEX index_persons_on_name")
    conn.execute("CREATE FULLTEXT INDEX index_persons_on_name ON persons (name) WITH PARSER ngram")
  end
end

RSpec.configure do |config|
  config.before(:context, :ngram_person_index) do
    NgramPersonIndex.recreate!
  end
end
