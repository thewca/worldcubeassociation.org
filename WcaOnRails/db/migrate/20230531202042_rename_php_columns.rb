# frozen_string_literal: true

class RenamePhpColumns < ActiveRecord::Migration[7.0]
  def change
    change_table :Competitions do |t|
      t.rename :cityName, :city_name
      t.rename :countryId, :country_id
      t.rename :venueAddress, :venue_address
      t.rename :venueDetails, :venue_details
      t.rename :cellName, :cell_name
      t.rename :showAtAll, :show_at_all
    end

    rename_table :Competitions, :competitions

    change_table :CompetitionsMedia do |t|
      t.rename :type, :media_type
      t.rename :competitionId, :competition_id
      t.rename :submitterName, :submitter_name
      t.rename :submitterComment, :submitter_comment
      t.rename :submitterEmail, :submitter_email
      t.rename :timestampSubmitted, :submitted_at
      t.rename :timestampDecided, :decided_at
    end

    rename_table :CompetitionsMedia, :competition_media

    change_table :Continents do |t|
      t.rename :recordName, :record_name
    end

    rename_table :Continents, :continents

    change_table :Countries do |t|
      t.rename :continentId, :continent_id
    end

    rename_table :Countries, :countries

    change_table :Events do |t|
      t.rename :cellName, :cell_name
    end

    rename_table :Events, :events

    rename_table :Formats, :formats

    change_table :RoundTypes do |t|
      t.rename :cellName, :cell_name
    end

    rename_table :RoundTypes, :round_types

    change_table :Persons do |t|
      t.rename :subId, :sub_id
      t.rename :countryId, :country_id
    end

    rename_table :Persons, :persons

    change_table :InboxPersons do |t|
      t.rename :wcaId, :wca_id
      t.rename :countryId, :country_iso2
      t.rename :competitionId, :competition_id
    end

    rename_table :InboxPersons, :inbox_persons
  end
end
