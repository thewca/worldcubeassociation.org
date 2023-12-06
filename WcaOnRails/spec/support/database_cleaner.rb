# frozen_string_literal: true

RSpec.configure do |config|
  config.before(:suite) do
    DatabaseCleaner.clean_with :truncation
    TestDbManager.fill_tables
  end

  config.before(:each) do
    DatabaseCleaner.strategy = :transaction
  end

  def set_truncation_strategy
    DatabaseCleaner.strategy = :truncation, { except: TestDbManager::CONSTANT_TABLES }
  end

  config.before(:each, clean_db_with_truncation: true) do
    set_truncation_strategy
  end

  config.before(:each, js: true) do
    set_truncation_strategy
  end

  config.before(:each) do
    DatabaseCleaner.start
  end

  # Using append_after to allow our E2E tests to finish all requests first and THEN clean the database
  # as per https://github.com/DatabaseCleaner/database_cleaner#rspec-with-capybara-example
  config.append_after(:each) do
    DatabaseCleaner.clean
  end
end
