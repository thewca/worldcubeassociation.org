# frozen_string_literal: true
RSpec.configure do |config|
  config.before(:suite) do
    ActiveRecord::Base.connection.execute("SET foreign_key_checks = 0;")
    DatabaseCleaner.clean_with :truncation
    ActiveRecord::Base.connection.execute("SET foreign_key_checks = 1;")
    TestDbManager.fill_tables
  end

  config.before(:each) do
    DatabaseCleaner.strategy = :transaction
  end

  config.before(:each, js: true) do
    DatabaseCleaner.strategy = :truncation, { except: TestDbManager::CONSTANT_TABLES }
  end

  config.before(:each) do
    DatabaseCleaner.start
  end

  config.after(:each) do
    DatabaseCleaner.clean
  end
end
