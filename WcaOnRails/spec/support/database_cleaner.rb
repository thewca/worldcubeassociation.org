# frozen_string_literal: true

RSpec.configure do |config|
  unless ENV['SKIP_PRETEST_SETUP'] == 'true'
    config.before(:suite) do
      DatabaseCleaner.clean_with :truncation
      TestDbManager.fill_tables
    end
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

  config.after(:each) do
    DatabaseCleaner.clean
  end
end
