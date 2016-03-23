RSpec.configure do |config|
  config.before(:suite) do
    DatabaseCleaner.clean_with(:truncation)
  end

  config.before(:each) do
    DatabaseCleaner.strategy = :transaction
  end

  config.before(:each, js: true) do
    DatabaseCleaner.strategy = :truncation
  end

  config.before(:each) do
    DatabaseCleaner.start
    FactoryGirl.create(:team, friendly_id: 'software', name: 'Software Team', description: 'Does software')
    FactoryGirl.create(:team, friendly_id: 'results', name: 'Results Team', description: 'Posts results')
    FactoryGirl.create(:team, friendly_id: 'wrc', name: 'WRC Team', description: 'Regulations')
    FactoryGirl.create(:team, friendly_id: 'wdc', name: 'WDC Team', description: 'Disciplinary Committee')
  end

  config.after(:each) do
    DatabaseCleaner.clean
  end
end
