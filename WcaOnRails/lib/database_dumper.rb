# frozen_string_literal: true

module DatabaseDumper
  JOIN_WHERE_VISIBLE_COMP = "JOIN Competitions ON Competitions.id=competition_id WHERE showAtAll=1"

  def self.actions_to_column_sanitizers(columns_by_action)
    {}.tap do |column_sanitizers|
      columns_by_action.each do |action, columns|
        case action
        when :copy, :db_default
          columns.each do |column|
            column_sanitizers[column] = action
          end
        when :fake_values
          columns.each do |column, column_sanitizer|
            column_sanitizers[column] = column_sanitizer
          end
        else
          raise "Unrecognized action #{action}"
        end
      end
    end
  end

  TABLE_SANITIZERS = {
    "Competitions" => {
      where_clause: "WHERE showAtAll = TRUE",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          name
          cityName
          countryId
          information
          year
          month
          day
          endYear
          endMonth
          endDay
          start_date
          end_date
          venue
          venueAddress
          venueDetails
          external_website
          cellName
          showAtAll
          latitude
          longitude
          isConfirmed
          contact
          registration_open
          registration_close
          enable_donations
          use_wca_registration
          guests_enabled
          results_posted_at
          results_nag_sent_at
          generate_website
          announced_at
          base_entry_fee_lowest_denomination
          currency_code
        ),
        db_default: %w(
          connected_stripe_account_id
        ),
        fake_values: {
          "remarks" => "'remarks to the board here'",
        },
      ),
    }.freeze,
    "CompetitionsMedia" => {
      where_clause: "WHERE status = 'accepted'",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          competitionId
          type
          text
          uri
          timestampSubmitted
          timestampDecided
          status
        ),
        fake_values: {
          "submitterName" => "'mr. media submitter'",
          "submitterComment" => "'a comment about this media'",
          "submitterEmail" => "'mediasubmitter@example.com'",
        },
      ),
    }.freeze,
    "ConciseAverageResults" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          average
          continentId
          countryId
          day
          eventId
          id
          month
          personId
          valueAndId
          year
        ),
      ),
    }.freeze,
    "ConciseSingleResults" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          best
          continentId
          countryId
          day
          eventId
          id
          month
          personId
          valueAndId
          year
        ),
      ),
    }.freeze,
    "Continents" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          latitude
          longitude
          name
          recordName
          zoom
        ),
      ),
    }.freeze,
    "Countries" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          continentId
          iso2
          name
        ),
      ),
    }.freeze,
    "Events" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          cellName
          format
          name
          rank
        ),
      ),
    }.freeze,
    "Formats" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          expected_solve_count
          name
          sort_by
          sort_by_second
          trim_fastest_n
          trim_slowest_n
        ),
      ),
    }.freeze,
    "InboxPersons" => :skip_all_rows,
    "InboxResults" => :skip_all_rows,
    "Persons" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          comments
          countryId
          gender
          name
          rails_id
          subId
        ),
        db_default: %w(comments),
        fake_values: {
          "year" => "1954",
          "month" => "12",
          "day" => "4",
        },
      ),
    }.freeze,
    "RanksAverage" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          best
          continentRank
          countryRank
          eventId
          personId
          worldRank
        ),
      ),
    }.freeze,
    "RanksSingle" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          best
          continentRank
          countryRank
          eventId
          personId
          worldRank
        ),
      ),
    }.freeze,
    "Results" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          average
          best
          competitionId
          countryId
          eventId
          formatId
          personId
          personName
          pos
          regionalAverageRecord
          regionalSingleRecord
          roundTypeId
          updated_at
          value1
          value2
          value3
          value4
          value5
        ),
      ),
    }.freeze,
    "rounds" => {
      where_clause: "JOIN competition_events ON competition_events.id = competition_event_id #{JOIN_WHERE_VISIBLE_COMP}",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          competition_event_id
          format_id
          number
          time_limit
          cutoff
          advancement_condition
          created_at
          updated_at
        ),
      ),
    }.freeze,
    "RoundTypes" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          cellName
          final
          name
          rank
        ),
      ),
    }.freeze,
    "Scrambles" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          competitionId
          eventId
          groupId
          isExtra
          roundTypeId
          scramble
          scrambleId
          scrambleNum
        ),
      ),
    }.freeze,
    "ar_internal_metadata" => :skip_all_rows,
    "competition_delegates" => {
      where_clause: JOIN_WHERE_VISIBLE_COMP,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          competition_id
          created_at
          delegate_id
          receive_registration_emails
          updated_at
        ),
      ),
    }.freeze,
    "competition_events" => {
      where_clause: JOIN_WHERE_VISIBLE_COMP,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          competition_id
          event_id
          fee_lowest_denomination
        ),
      ),
    }.freeze,
    "competition_organizers" => {
      where_clause: JOIN_WHERE_VISIBLE_COMP,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          competition_id
          created_at
          organizer_id
          receive_registration_emails
          updated_at
        ),
      ),
    }.freeze,
    "competition_tabs" => {
      where_clause: JOIN_WHERE_VISIBLE_COMP,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          competition_id
          content
          display_order
          name
        ),
      ),
    }.freeze,
    "completed_jobs" => :skip_all_rows,
    "delayed_jobs" => :skip_all_rows,
    "delegate_reports" => {
      where_clause: JOIN_WHERE_VISIBLE_COMP,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          competition_id
          created_at
          updated_at
        ),
        db_default: %w(
          equipment
          venue
          organization
          schedule_url
          incidents
          remarks
          discussion_url
          posted_by_user_id
          posted_at
          nag_sent_at
        ),
      ),
    }.freeze,
    "oauth_access_grants" => :skip_all_rows,
    "oauth_access_tokens" => :skip_all_rows,
    "oauth_applications" => :skip_all_rows,
    "old_registrations" => :skip_all_rows,
    "archive_phpbb3_forums" => :skip_all_rows,
    "archive_phpbb3_posts" => :skip_all_rows,
    "archive_phpbb3_topics" => :skip_all_rows,
    "archive_phpbb3_users" => :skip_all_rows,
    "poll_options" => :skip_all_rows,
    "polls" => :skip_all_rows,
    "posts" => {
      where_clause: "WHERE world_readable = TRUE",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          author_id
          body
          created_at
          slug
          sticky
          title
          updated_at
          world_readable
          show_on_homepage
        ),
      ),
    }.freeze,
    "post_tags" => {
      where_clause: "JOIN posts ON posts.id=post_tags.post_id WHERE world_readable = TRUE",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          post_id
          tag
        ),
      ),
    }.freeze,
    "preferred_formats" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          event_id
          format_id
          ranking
        ),
      ),
    }.freeze,
    "rails_persons" => :skip_all_rows,
    "registration_competition_events" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          competition_event_id
          registration_id
        ),
      ),
    }.freeze,
    "registration_payments" => :skip_all_rows,
    "registrations" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          accepted_at
          accepted_by
          competition_id
          created_at
          deleted_at
          deleted_by
          guests
          updated_at
          user_id
        ),
        db_default: %w(ip),
        fake_values: {
          "comments" => "''", # Can't use :db_default here because comments does not have a default value.
        },
      ),
    }.freeze,
    "schema_migrations" => :skip_all_rows, # This is populated when loading our schema dump
    "team_members" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          created_at
          end_date
          start_date
          team_id
          team_leader
          updated_at
          user_id
        ),
      ),
    }.freeze,
    "teams" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          created_at
          friendly_id
          email
          rank
          updated_at
        ),
      ),
    }.freeze,
    "user_preferred_events" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          event_id
          user_id
        ),
      ),
    }.freeze,
    "users" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          id
          avatar
          confirmed_at
          country_iso2
          created_at
          current_sign_in_at
          delegate_id_to_handle_wca_id_claim
          delegate_status
          gender
          last_sign_in_at
          location_description
          name
          region
          results_notifications_enabled
          saved_avatar_crop_h
          saved_avatar_crop_w
          saved_avatar_crop_x
          saved_avatar_crop_y
          saved_pending_avatar_crop_h
          saved_pending_avatar_crop_w
          saved_pending_avatar_crop_x
          saved_pending_avatar_crop_y
          senior_delegate_id unconfirmed_wca_id
          updated_at
          wca_id
        ),
        db_default: %w(
          confirmation_sent_at
          confirmation_token
          current_sign_in_ip
          encrypted_password
          last_sign_in_ip
          notes
          pending_avatar
          phone_number
          preferred_locale
          remember_created_at
          reset_password_sent_at
          reset_password_token
          sign_in_count
          unconfirmed_email
        ),
        fake_values: {
          "dob" => "'1954-12-04'",
          "email" => "CONCAT(id, '@worldcubeassociation.org')",
        },
      ),
    }.freeze,
    "vote_options" => :skip_all_rows,
    "votes" => :skip_all_rows,
    "linkings" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          wca_id
          wca_ids
        ),
      ),
    }.freeze,
    "timestamps" => {
      where_clause: "",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w(
          name
          date
        ),
      ),
    }.freeze,
  }.freeze

  def self.development_dump(dump_filename)
    dump_db_name = "wca_development_db_dump"

    LogTask.log_task "Creating temporary database '#{dump_db_name}'" do
      ActiveRecord::Base.connection.execute("DROP DATABASE IF EXISTS #{dump_db_name}")
      ActiveRecord::Base.connection.execute("CREATE DATABASE #{dump_db_name} DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci")
      self.mysql("SOURCE #{Rails.root.join('db', 'structure.sql')}", dump_db_name)
    end

    LogTask.log_task "Populating sanitized tables in '#{dump_db_name}'" do
      TABLE_SANITIZERS.each do |table_name, table_sanitizer|
        next if table_sanitizer == :skip_all_rows

        column_sanitizers = table_sanitizer[:column_sanitizers].select do |column_name, column_sanitizer|
          column_sanitizer != :db_default
        end

        column_expressions = column_sanitizers.map do |column_name, column_sanitizer|
          column_sanitizer == :copy ? "#{table_name}.#{column_name}" : "#{column_sanitizer} as #{column_name}"
        end.join(", ")

        populate_table_sql = "INSERT INTO #{dump_db_name}.#{table_name} (#{column_sanitizers.keys.join(", ")}) SELECT #{column_expressions} FROM #{table_name} #{table_sanitizer[:where_clause]}"
        ActiveRecord::Base.connection.execute(populate_table_sql)
      end
    end

    LogTask.log_task "Dumping '#{dump_db_name}' to '#{dump_filename}'" do
      self.mysqldump(dump_db_name, dump_filename)
    end
  ensure
    ActiveRecord::Base.connection.execute("DROP DATABASE IF EXISTS #{dump_db_name}")
  end

  def self.mysql_cli_creds
    config = ActiveRecord::Base.connection_config
    "--user=#{config[:username]} --password=#{config[:password] || "''"} --host=#{config[:host]}"
  end

  def self.mysql(command, database = nil)
    `mysql #{self.mysql_cli_creds} #{database} -e '#{command}' #{filter_out_mysql_warning}`
  end

  def self.mysqldump(db_name, dest_filename)
    `mysqldump #{self.mysql_cli_creds} #{db_name} -r #{dest_filename} #{filter_out_mysql_warning}`
  end

  def self.filter_out_mysql_warning
    '2>&1 | grep -v "[Warning] Using a password on the command line interface can be insecure."'
  end
end
