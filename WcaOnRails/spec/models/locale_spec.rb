# frozen_string_literal: true
require 'rails_helper'

RSpec.describe Locale do
  def hash(original_text)
    Digest::SHA1.hexdigest(original_text)[0..6]
  end

  before :each do
    allow(File).to receive(:read).with(any_args).and_call_original

    en_filename = Rails.root.join('config', 'locales', 'en.yml')
    en_yaml = "
en:
  layer1:
    old_key: 'World Cube Association'
    just_added: 'i am so new, i have not been translated yet'
    recently_changed: 'missing has two s-es, silly'

  pluralizing:
    comps:
      zero: 'You have been to no comps'
      one: 'You have been to a comp'
      few: 'You have been to a bunch of comps'

  cubes:
    zero: 'You do not have enough cubes'
    one: 'You do not have enough cubes'
    few: 'You probably do not have enough cubes'
"
    allow(File).to receive(:read).with(en_filename).and_return(en_yaml)
    @en = Locale.new('en')

    es_filename = Rails.root.join('config', 'locales', 'es.yml')
    es_yaml = "
es:
  layer1:
    #original_hash: #{hash('World Cube Association')}
    old_key: 'World Cube Association'
    please_remove_me: 'I should not exist'

    #original_hash: #{hash('i cannot spell mising')}
    recently_changed: 'i have not been updated'

  pluralizing:
    #original_hash: #{hash(JSON.generate(@en['en']['pluralizing']['comps']))}
    comps:
      zero: 'You have been to no comps'
      one: 'You have been to a comp'
      few: 'You have been to a bunch of comps'

  magics:
    zero: 'You have the right number of magics'
    one: 'You have too many magics'
    few: 'You definitely have too many magics'
"
    allow(File).to receive(:read).with(es_filename).and_return(es_yaml)
    @es = Locale.new('es', true)
  end

  it "#compare_to works" do
    missing, unused, outdated = @es.compare_to(@en)
    expect(missing).to match_array ["layer1 > just_added", "cubes"]
    expect(unused).to match_array ["layer1 > please_remove_me", "magics"]
    expect(outdated).to match_array ["layer1 > recently_changed"]
  end
end
