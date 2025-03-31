# rubocop:disable all
# frozen_string_literal: true

class ConvertCompetitionWebsiteToUrl < ActiveRecord::Migration
  def up
    Competition.find_each do |competition|
      if competition.website && competition.website.count("[") == 1 && competition.website[0] == "["
        m = /\[ *{([^}]*)} *{([^}]*)} *\]/.match(competition.website)
        competition.update_column(:website, m[2])
      end
    end
  end
end
