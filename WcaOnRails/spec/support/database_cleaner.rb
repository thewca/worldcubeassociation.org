RSpec.configure do |config|
  reference_tables_to_keep = %w(Countries Continents Events Rounds Formats teams)
  config.before(:suite) do
    DatabaseCleaner.clean_with(:truncation, except: reference_tables_to_keep)
    reference_tables_to_keep.each do |table|
      ActiveRecord::Base.connection.execute("TRUNCATE #{table};")
      load "#{Rails.root}/db/seeds/#{table.underscore}.seeds.rb"
    end
  end

  config.before(:each) do
    DatabaseCleaner.strategy = :transaction
  end

  config.before(:each, js: true) do
    DatabaseCleaner.strategy = :truncation, {except: reference_tables_to_keep}
  end

  config.before(:each) do
    DatabaseCleaner.start
  end

  config.after(:each) do
    DatabaseCleaner.clean
  end
end
