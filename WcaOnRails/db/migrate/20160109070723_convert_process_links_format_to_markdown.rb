# frozen_string_literal: true

class ConvertProcessLinksFormatToMarkdown < ActiveRecord::Migration
  def processLinks_to_markdown(s)
    s ? s.gsub(/\[ *{([^}]+)} *{([^}]+)} *\]/, '[\1](\2)') : nil
  end

  def change
    reversible do |dir|
      dir.up do
        Competition.all.each do |competition|
          competition.update_columns(
            venue: processLinks_to_markdown(competition.venue),
            venueDetails: processLinks_to_markdown(competition.venueDetails),
            contact: processLinks_to_markdown(competition.contact),
            information: processLinks_to_markdown(competition.information),
          )
        end
      end

      dir.down do
      end
    end
  end
end
