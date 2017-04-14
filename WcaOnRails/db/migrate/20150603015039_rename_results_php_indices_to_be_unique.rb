# frozen_string_literal: true

class RenameResultsPhpIndicesToBeUnique < ActiveRecord::Migration
  def change
    # In sqlite, index names must be unique across the entire database.
    # See: http://stackoverflow.com/a/1982880
    rename_index "InboxPersons", "fk_country", "InboxPersons_fk_country"
    rename_index "InboxPersons_old", "fk_country", "InboxPersons_old_fk_country"
    rename_index "Persons", "fk_country", "Persons_fk_country"

    rename_index "InboxPersons", "id", "InboxPersons_id"
    rename_index "InboxPersons_old", "id", "InboxPersons_old_id"
    rename_index "Persons", "id", "Persons_id"

    rename_index "InboxPersons", "name", "InboxPersons_name"
    rename_index "InboxPersons_old", "name", "InboxPersons_old_name"
    rename_index "Persons", "name", "Persons_name"

    rename_index "InboxResults", "fk_tournament", "InboxResults_fk_tournament"
    rename_index "InboxResults_old", "fk_tournament", "InboxResults_old_fk_tournament"
    rename_index "Results", "fk_tournament", "Results_fk_tournament"

    rename_index "InboxResults", "fk_event", "InboxResults_fk_event"
    rename_index "InboxResults_old", "fk_event", "InboxResults_old_fk_event"
    rename_index "Results", "fk_event", "Results_fk_event"

    rename_index "InboxResults", "fk_format", "InboxResults_fk_format"
    rename_index "InboxResults_old", "fk_format", "InboxResults_old_fk_format"
    rename_index "Results", "fk_format", "Results_fk_format"

    rename_index "InboxResults", "fk_round", "InboxResults_fk_round"
    rename_index "InboxResults_old", "fk_round", "InboxResults_old_fk_round"
    rename_index "Results", "fk_round", "Results_fk_round"

    rename_index "InboxResults_old", "eventAndAverage", "InboxResults_old_eventAndAverage"
    rename_index "Results", "eventAndAverage", "Results_eventAndAverage"

    rename_index "InboxResults_old", "eventAndBest", "InboxResults_old_eventAndBest"
    rename_index "Results", "eventAndBest", "Results_eventAndBest"

    rename_index "InboxResults_old", "regionalAverageRecordCheckSpeedup", "InboxResults_old_regionalAverageRecordCheckSpeedup"
    rename_index "Results", "regionalAverageRecordCheckSpeedup", "Results_regionalAverageRecordCheckSpeedup"

    rename_index "InboxResults_old", "regionalSingleRecordCheckSpeedup", "InboxResults_old_regionalSingleRecordCheckSpeedup"
    rename_index "Results", "regionalSingleRecordCheckSpeedup", "Results_regionalSingleRecordCheckSpeedup"

    rename_index "InboxResults_old", "fk_competitor", "InboxResults_old_fk_competitor"
    rename_index "Results", "fk_competitor", "Results_fk_competitor"

    rename_index "RanksAverage", "fk_events", "RanksAverage_fk_events"
    rename_index "RanksSingle", "fk_events", "RanksSingle_fk_events"

    rename_index "RanksAverage", "fk_persons", "RanksAverage_fk_persons"
    rename_index "RanksSingle", "fk_persons", "RanksSingle_fk_persons"
  end
end
