# frozen_string_literal: true

class ChangeMediaTimestampDecidedToNullable < ActiveRecord::Migration[5.2]
  def up
    change_column :CompetitionsMedia, :timestampDecided, :timestamp, default: nil, null: true

    # Depending on @@SQL_MODE the MySQL may throw an error seeing the invalid timestamp below,
    # so we temporarily allow those invalid timestamps.
    execute("SET @OLD_SQL_MODE = @@SQL_MODE, @@SQL_MODE = '';")

    # Due to implementation error, the timestamp may be unset for some accepted media.
    CompetitionMedium
      .where(status: "accepted").where("timestampDecided = '0000-00-00 00:00:00'")
      .update_all("timestampDecided = timestampSubmitted")

    CompetitionMedium
      .where(status: "pending").where("timestampDecided = '0000-00-00 00:00:00'")
      .update_all(timestampDecided: nil)

    execute("SET @@SQL_MODE = @OLD_SQL_MODE;")
  end

  def down
    # Depending on @@SQL_MODE the MySQL may throw an error seeing the invalid timestamp below,
    # so we temporarily allow those invalid timestamps.
    execute("SET @OLD_SQL_MODE = @@SQL_MODE, @@SQL_MODE = '';")

    CompetitionMedium
      .where(timestampDecided: nil)
      .update_all("timestampDecided = '0000-00-00 00:00:00'")

    # We need an explicit query as Rails parses '0000-00-00 00:00:00' as nil.
    execute("ALTER TABLE CompetitionsMedia MODIFY timestampDecided timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'")

    execute("SET @@SQL_MODE = @OLD_SQL_MODE;")
  end
end
