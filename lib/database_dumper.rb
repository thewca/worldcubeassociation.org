# frozen_string_literal: true

module DatabaseDumper
  WHERE_VISIBLE_COMP = "WHERE competitions.show_at_all = 1"
  JOIN_WHERE_VISIBLE_COMP = "JOIN competitions ON competitions.id = competition_id #{WHERE_VISIBLE_COMP}".freeze
  DEV_TIMESTAMP_NAME = "developer_dump_exported_at"
  RESULTS_TIMESTAMP_NAME = "public_results_exported_at"
  PUBLIC_COMPETITION_JOIN = "LEFT JOIN competition_events ON competitions.id = competition_events.competition_id " \
                            "LEFT JOIN competition_delegates ON competitions.id = competition_delegates.competition_id " \
                            "LEFT JOIN users AS users_delegates ON users_delegates.id = competition_delegates.delegate_id " \
                            "LEFT JOIN competition_organizers ON competitions.id = competition_organizers.competition_id " \
                            "LEFT JOIN users AS users_organizers ON users_organizers.id = competition_organizers.organizer_id #{WHERE_VISIBLE_COMP} " \
                            "GROUP BY competitions.id".freeze

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

  DEV_SANITIZERS = {
    "competitions" => {
      where_clause: WHERE_VISIBLE_COMP,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          name
          name_reason
          city_name
          country_id
          information
          start_date
          end_date
          venue
          venue_address
          venue_details
          external_website
          cell_name
          show_at_all
          latitude
          longitude
          confirmed_at
          contact
          registration_open
          registration_close
          enable_donations
          use_wca_registration
          external_registration_page
          competitor_limit_enabled
          competitor_limit
          competitor_limit_reason
          guests_enabled
          guests_per_registration_limit
          events_per_registration_limit
          results_posted_at
          results_submitted_at
          results_nag_sent_at
          registration_reminder_sent_at
          generate_website
          announced_at
          base_entry_fee_lowest_denomination
          currency_code
          extra_registration_requirements
          created_at
          updated_at
          on_the_spot_registration
          on_the_spot_entry_fee_lowest_denomination
          refund_policy_percent
          refund_policy_limit_date
          guests_entry_fee_lowest_denomination
          guest_entry_status
          early_puzzle_submission
          early_puzzle_submission_reason
          qualification_results
          qualification_results_reason
          event_restrictions
          event_restrictions_reason
          announced_by
          results_posted_by
          posting_by
          main_event_id
          cancelled_at
          cancelled_by
          waiting_list_deadline_date
          event_change_deadline_date
          force_comment_in_registration
          allow_registration_edits
          competition_series_id
          use_wca_live_for_scoretaking
          allow_registration_without_qualification
          forbid_newcomers
          forbid_newcomers_reason
          auto_close_threshold
          auto_accept_disable_threshold
          newcomer_month_reserved_spots
          competitor_can_cancel
        ],
        db_default: %w[
          auto_accept_preference
          connected_stripe_account_id
        ],
        fake_values: {
          "remarks" => "'remarks to the board here'",
        },
      ),
    }.freeze,
    "competition_payment_integrations" => :skip_all_rows,
    "competition_media" => {
      where_clause: "WHERE status = 'accepted'",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          competition_id
          media_type
          text
          uri
          submitted_at
          decided_at
          status
        ],
        fake_values: {
          "submitter_name" => "'mr. media submitter'",
          "submitter_comment" => "'a comment about this media'",
          "submitter_email" => "'mediasubmitter@example.com'",
        },
      ),
    }.freeze,
    "concise_average_results" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          average
          continent_id
          country_id
          day
          event_id
          id
          month
          person_id
          value_and_id
          year
        ],
      ),
    }.freeze,
    "concise_single_results" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          best
          continent_id
          country_id
          day
          event_id
          id
          month
          person_id
          value_and_id
          year
        ],
      ),
    }.freeze,
    "connected_paypal_accounts" => :skip_all_rows,
    "connected_stripe_accounts" => :skip_all_rows,
    "manual_payment_integrations" => :skip_all_rows,
    "continents" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          latitude
          longitude
          name
          record_name
          zoom
        ],
      ),
    }.freeze,
    "countries" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          continent_id
          iso2
          name
        ],
      ),
    }.freeze,
    "events" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          format
          name
          rank
        ],
      ),
    }.freeze,
    "formats" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          expected_solve_count
          name
          sort_by
          sort_by_second
          trim_fastest_n
          trim_slowest_n
        ],
      ),
    }.freeze,
    "inbox_persons" => :skip_all_rows,
    "inbox_results" => :skip_all_rows,
    "inbox_scramble_sets" => :skip_all_rows,
    "inbox_scrambles" => :skip_all_rows,
    "persons" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          wca_id
          comments
          country_id
          gender
          name
          sub_id
        ],
        db_default: %w[
          comments
          incorrect_wca_id_claim_count
        ],
        fake_values: {
          "dob" => "'1954-12-04'",
        },
      ),
    }.freeze,
    "ranks_average" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          best
          continent_rank
          country_rank
          event_id
          person_id
          world_rank
        ],
      ),
    }.freeze,
    "ranks_single" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          best
          continent_rank
          country_rank
          event_id
          person_id
          world_rank
        ],
      ),
    }.freeze,
    "results" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          average
          best
          competition_id
          country_id
          event_id
          format_id
          person_id
          person_name
          pos
          regional_average_record
          regional_single_record
          round_type_id
          round_id
          updated_at
          value1
          value2
          value3
          value4
          value5
        ],
      ),
    }.freeze,
    "rounds" => {
      where_clause: "JOIN competition_events ON competition_events.id = competition_event_id #{JOIN_WHERE_VISIBLE_COMP}",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          competition_event_id
          format_id
          total_number_of_rounds
          number
          time_limit
          cutoff
          advancement_condition
          scramble_set_count
          round_results
          created_at
          updated_at
          old_type
          linked_round_id
        ],
      ),
    }.freeze,
    "linked_rounds" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          wcif_id
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "round_types" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          cell_name
          final
          name
          rank
        ],
      ),
    }.freeze,
    "scrambles" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          competition_id
          event_id
          group_id
          is_extra
          round_type_id
          round_id
          scramble
          id
          scramble_num
        ],
      ),
    }.freeze,
    "active_storage_attachments" => :skip_all_rows,
    "active_storage_blobs" => :skip_all_rows,
    "active_storage_variant_records" => :skip_all_rows,
    "ar_internal_metadata" => :skip_all_rows,
    "result_attempts" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          value
          attempt_number
          result_id
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "competition_delegates" => {
      where_clause: JOIN_WHERE_VISIBLE_COMP,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          competition_id
          created_at
          delegate_id
          receive_registration_emails
          updated_at
        ],
      ),
    }.freeze,
    "competition_events" => {
      where_clause: JOIN_WHERE_VISIBLE_COMP,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          competition_id
          event_id
          fee_lowest_denomination
          qualification
        ],
      ),
    }.freeze,
    "competition_organizers" => {
      where_clause: JOIN_WHERE_VISIBLE_COMP,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          competition_id
          created_at
          organizer_id
          receive_registration_emails
          updated_at
        ],
      ),
    }.freeze,
    "competition_series" => {
      # One Series can be associated with many competitions, so any JOIN will inherently produce duplicates. Get rid of them by using GROUP BY.
      where_clause: "LEFT JOIN competitions ON competitions.competition_series_id=competition_series.id #{WHERE_VISIBLE_COMP} GROUP BY competition_series.id",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          wcif_id
          name
          short_name
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "competition_tabs" => {
      where_clause: JOIN_WHERE_VISIBLE_COMP,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          competition_id
          content
          display_order
          name
        ],
      ),
    }.freeze,
    "competition_venues" => {
      where_clause: JOIN_WHERE_VISIBLE_COMP,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          competition_id
          wcif_id
          name
          country_iso2
          latitude_microdegrees
          longitude_microdegrees
          timezone_id
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "venue_rooms" => {
      where_clause: "JOIN competition_venues ON competition_venues.id = competition_venue_id #{JOIN_WHERE_VISIBLE_COMP}",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          competition_venue_id
          wcif_id
          name
          color
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "live_results" => :skip_all_rows,
    "live_attempts" => :skip_all_rows,
    "live_attempt_history_entries" => :skip_all_rows,
    "schedule_activities" => {
      where_clause: "JOIN venue_rooms ON venue_rooms.id = venue_room_id JOIN competition_venues ON competition_venues.id = venue_rooms.competition_venue_id #{JOIN_WHERE_VISIBLE_COMP}",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          venue_room_id
          parent_activity_id
          wcif_id
          name
          activity_code
          round_id
          start_time
          end_time
          scramble_set_id
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "delegate_reports" => {
      where_clause: JOIN_WHERE_VISIBLE_COMP,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          version
          competition_id
          created_at
          updated_at
        ],
        db_default: %w[
          summary
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
          wrc_feedback_requested
          wrc_incidents
          wic_feedback_requested
          wic_incidents
          wrc_primary_user_id
          wrc_secondary_user_id
          reminder_sent_at
        ],
      ),
    }.freeze,
    "oauth_access_grants" => :skip_all_rows,
    "oauth_access_tokens" => :skip_all_rows,
    "oauth_applications" => :skip_all_rows,
    "oauth_openid_requests" => :skip_all_rows,
    "archive_registrations" => :skip_all_rows,
    "archive_phpbb3_forums" => :skip_all_rows,
    "archive_phpbb3_posts" => :skip_all_rows,
    "archive_phpbb3_topics" => :skip_all_rows,
    "archive_phpbb3_users" => :skip_all_rows,
    "poll_options" => :skip_all_rows,
    "polls" => :skip_all_rows,
    "posts" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          author_id
          body
          created_at
          slug
          sticky
          unstick_at
          title
          updated_at
          show_on_homepage
        ],
      ),
    }.freeze,
    "post_tags" => {
      where_clause: "JOIN posts ON posts.id=post_tags.post_id",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          post_id
          tag
        ],
      ),
    }.freeze,
    "preferred_formats" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          event_id
          format_id
          ranking
        ],
      ),
    }.freeze,
    "regional_organizations" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          name
          country
          website
          start_date
          end_date
          created_at
          updated_at
        ],
        fake_values: {
          "email" => "'contact@regional-organization.org'",
          "address" => "'Street and Number, City, State, Postal code, Country'",
          "directors_and_officers" => "'Directors and Officers'",
          "area_description" => "'Area'",
          "past_and_current_activities" => "'Activities'",
          "future_plans" => "'Plans'",
          "extra_information" => "'Extra information'",
        },
      ),
    }.freeze,
    "regional_records_lookup" => :skip_all_rows,
    "registration_competition_events" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          competition_event_id
          registration_id
        ],
      ),
    }.freeze,
    "registration_payments" => :skip_all_rows,
    "registrations" => {
      where_clause: JOIN_WHERE_VISIBLE_COMP,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          accepted_at
          accepted_by
          competition_id
          registrant_id
          created_at
          deleted_at
          deleted_by
          guests
          updated_at
          user_id
          roles
          is_competing
          competing_status
          registered_at
        ],
        db_default: %w[ip],
        fake_values: {
          "comments" => "''", # Can't use :db_default here because comments does not have a default value.
          "administrative_notes" => "''", # Can't use :db_default here because administrative_notes does not have a default value.
        },
      ),
    }.freeze,
    "registration_history_changes" => :skip_all_rows,
    "registration_history_entries" => :skip_all_rows,
    "waiting_lists" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          holder_type
          holder_id
          entries
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "sanity_checks" => :skip_all_rows,
    "sanity_check_categories" => :skip_all_rows,
    "sanity_check_exclusions" => :skip_all_rows,
    "cached_results" => :skip_all_rows,
    "schema_migrations" => :skip_all_rows, # This is populated when loading our schema dump
    "starburst_announcement_views" => :skip_all_rows,
    "starburst_announcements" => :skip_all_rows,
    "user_preferred_events" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          event_id
          user_id
        ],
      ),
    }.freeze,
    "user_groups" => {
      # groups have a self-referencing foreign key to their parent group, so we need to make sure that root groups are inserted first
      order_by_clause: "ORDER BY parent_group_id ASC",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          name
          group_type
          parent_group_id
          is_active
          is_hidden
          metadata_id
          metadata_type
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "groups_metadata_board" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          email
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "groups_metadata_delegate_regions" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          email
          friendly_id
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "groups_metadata_councils" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          email
          friendly_id
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "groups_metadata_teams_committees" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          email
          friendly_id
          preferred_contact_mode
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "groups_metadata_translators" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          locale
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "users" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          current_avatar_id
          competition_notifications_enabled
          confirmed_at
          country_iso2
          created_at
          current_sign_in_at
          delegate_id_to_handle_wca_id_claim
          gender
          last_sign_in_at
          name
          registration_notifications_enabled
          results_notifications_enabled
          unconfirmed_wca_id
          updated_at
          wca_id
          receive_delegate_reports
          delegate_reports_region_id
          delegate_reports_region_type
          dummy_account
        ],
        db_default: %w[
          confirmation_sent_at
          confirmation_token
          consumed_timestep
          cookies_acknowledged
          current_sign_in_ip
          encrypted_password
          last_sign_in_ip
          otp_backup_codes
          otp_required_for_login
          pending_avatar_id
          preferred_locale
          remember_created_at
          reset_password_sent_at
          reset_password_token
          sign_in_count
          unconfirmed_email
          session_validity_token
          otp_secret
        ],
        fake_values: {
          "dob" => "'1954-12-04'",
          "email" => "CONCAT(id, '@worldcubeassociation.org')",
        },
      ),
    }.freeze,
    "user_avatars" => {
      where_clause: "WHERE status = 'approved'",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          user_id
          filename
          status
          thumbnail_crop_x
          thumbnail_crop_y
          thumbnail_crop_w
          thumbnail_crop_h
          backend
          approved_at
          revoked_at
          created_at
          updated_at
        ],
        db_default: %w[
          approved_by
          revoked_by
          revocation_reason
        ],
      ),
    },
    "locations" => :skip_all_rows,
    "incidents" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[id title public_summary digest_worthy resolved_at digest_sent_at created_at updated_at],
        db_default: %w[private_description private_wrc_decision],
      ),
    }.freeze,
    "incident_competitions" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[id incident_id competition_id],
        db_default: %w[comments],
      ),
    }.freeze,
    "incident_tags" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[id incident_id tag],
      ),
    }.freeze,
    "vote_options" => :skip_all_rows,
    "votes" => :skip_all_rows,
    "server_settings" => {
      where_clause: "WHERE name NOT IN (#{ServerSetting::HIDDEN_SETTINGS.map { "'#{it}'" }.join(',')})",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          name
          value
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "cronjob_statistics" => :skip_all_rows,
    "championships" => {
      where_clause: JOIN_WHERE_VISIBLE_COMP,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          competition_id
          championship_type
        ],
      ),
    }.freeze,
    "eligible_country_iso2s_for_championship" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          championship_type
          eligible_country_iso2
        ],
      ),
    }.freeze,
    "wcif_extensions" => :skip_all_rows,
    "assignments" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          registration_id
          registration_type
          schedule_activity_id
          station_number
          assignment_code
        ],
      ),
    }.freeze,
    "paypal_records" => :skip_all_rows,
    "stripe_records" => :skip_all_rows,
    "payment_intents" => :skip_all_rows,
    "stripe_webhook_events" => :skip_all_rows,
    "uploaded_jsons" => :skip_all_rows,
    "scramble_file_uploads" => :skip_all_rows,
    "bookmarked_competitions" => {
      where_clause: JOIN_WHERE_VISIBLE_COMP,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          user_id
          competition_id
        ],
      ),
    }.freeze,
    "country_bands" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          number
          iso2
        ],
      ),
    }.freeze,
    "country_band_details" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          number
          start_date
          end_date
          due_amount_per_competitor_us_cents
          due_percent_registration_fee
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "user_roles" => {
      where_clause: "JOIN user_groups ON user_groups.id=group_id WHERE NOT user_groups.is_hidden",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          user_id
          group_id
          start_date
          end_date
          metadata_id
          metadata_type
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "roles_metadata_delegate_regions" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          status
          location
          first_delegated
          last_delegated
          total_delegated
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "roles_metadata_officers" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          status
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "roles_metadata_councils" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          status
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "roles_metadata_teams_committees" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          status
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "roles_metadata_banned_competitors" => :skip_all_rows,
    "wfc_xero_users" => :skip_all_rows,
    "wfc_dues_redirects" => :skip_all_rows,
    "ticket_logs" => :skip_all_rows,
    "ticket_log_changes" => :skip_all_rows,
    "ticket_comments" => :skip_all_rows,
    "ticket_stakeholders" => :skip_all_rows,
    "tickets" => :skip_all_rows,
    "tickets_edit_person" => :skip_all_rows,
    "tickets_edit_person_fields" => :skip_all_rows,
    "duplicate_checker_job_runs" => :skip_all_rows,
    "potential_duplicate_persons" => :skip_all_rows,
    "tickets_competition_result" => :skip_all_rows,
  }.freeze

  RESULTS_SANITIZERS = {
    "Results" => {
      source_table: "results",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          pos
          best
          average
          value1
          value2
          value3
          value4
          value5
        ],
        fake_values: {
          "competitionId" => "competition_id",
          "eventId" => "event_id",
          "roundTypeId" => "round_type_id",
          "personName" => "person_name",
          "personId" => "person_id",
          "formatId" => "format_id",
          "regionalSingleRecord" => "regional_single_record",
          "regionalAverageRecord" => "regional_average_record",
          "personCountryId" => "country_id",
        }.freeze,
      ),
    }.freeze,
    "RanksSingle" => {
      source_table: "ranks_single",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          best
        ],
        fake_values: {
          # Copy over column to keep backwards compatibility
          "personId" => "person_id",
          "eventId" => "event_id",
          "worldRank" => "world_rank",
          "continentRank" => "continent_rank",
          "countryRank" => "country_rank",
        },
      ),
    }.freeze,
    "RanksAverage" => {
      source_table: "ranks_average",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          best
        ],
        fake_values: {
          # Copy over column to keep backwards compatibility
          "personId" => "person_id",
          "eventId" => "event_id",
          "worldRank" => "world_rank",
          "continentRank" => "continent_rank",
          "countryRank" => "country_rank",
        },
      ),
    }.freeze,
    "RoundTypes" => {
      source_table: "round_types",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          final
          name
          rank
        ],
        fake_values: {
          # Copy over column to keep backwards compatibility
          "cellName" => "cell_name",
        },
      ),
    }.freeze,
    "Events" => {
      source_table: "events",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          format
          name
          rank
        ],
        fake_values: {
          # Copy over column to keep backwards compatibility
          "cellName" => "name",
        },
      ),
    }.freeze,
    "Formats" => {
      source_table: "formats",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          expected_solve_count
          name
          sort_by
          sort_by_second
          trim_fastest_n
          trim_slowest_n
        ],
      ),
    }.freeze,
    "Countries" => {
      source_table: "countries",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          iso2
          name
        ],
        fake_values: {
          "continentId" => "continent_id",
        }.freeze,
      ),
    }.freeze,
    "Continents" => {
      source_table: "continents",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          latitude
          longitude
          name
          zoom
        ],
        fake_values: {
          "recordName" => "record_name",
        }.freeze,
      ),
    }.freeze,
    "Persons" => {
      source_table: "persons",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          name
          gender
        ],
        fake_values: {
          "id" => "wca_id",
          "subid" => "sub_id",
          "countryId" => "country_id",
        },
      ),
    }.freeze,
    "Competitions" => {
      source_table: "competitions",
      where_clause: PUBLIC_COMPETITION_JOIN,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          name
          information
          external_website
          venue
          latitude
          longitude
        ],
        fake_values: {
          "cityName" => "city_name",
          "countryId" => "country_id",
          "venueAddress" => "venue_address",
          "venueDetails" => "venue_details",
          "cellName" => "cell_name",
          "cancelled" => "(competitions.cancelled_at IS NOT NULL AND competitions.cancelled_by IS NOT NULL)",
          "eventSpecs" => "REPLACE(GROUP_CONCAT(DISTINCT competition_events.event_id), \",\", \" \")",
          "wcaDelegate" => "GROUP_CONCAT(DISTINCT(CONCAT(\"[{\", users_delegates.name, \"}{mailto:\", users_delegates.email, \"}]\")) SEPARATOR \" \")",
          "organiser" => "GROUP_CONCAT(DISTINCT(CONCAT(\"[{\", users_organizers.name, \"}{mailto:\", users_organizers.email, \"}]\")) SEPARATOR \" \")",
          "year" => "YEAR(start_date)",
          "month" => "MONTH(start_date)",
          "day" => "DAY(start_date)",
          "endMonth" => "MONTH(end_date)",
          "endDay" => "DAY(end_date)",
        }.freeze,
      ),
      tsv_sanitizers: actions_to_column_sanitizers(
        fake_values: {
          "information" => "REGEXP_REPLACE(information, '[[:space:]]+', ' ')",
        },
      ),
    }.freeze,
    "Scrambles" => {
      source_table: "scrambles",
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          scramble
        ],
        fake_values: {
          "competitionId" => "competition_id",
          "eventId" => "event_id",
          "groupId" => "group_id",
          "isExtra" => "is_extra",
          "roundTypeId" => "round_type_id",
          "scrambleId" => "id",
          "scrambleNum" => "scramble_num",
        },
      ),
      tsv_sanitizers: actions_to_column_sanitizers(
        fake_values: {
          "scramble" => "IF(eventId='333mbf', REPLACE(scramble, '\\n', '|'), scramble)",
        },
      ),
    }.freeze,
    "championships" => {
      where_clause: JOIN_WHERE_VISIBLE_COMP,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          competition_id
          championship_type
        ],
      ),
    }.freeze,
    "eligible_country_iso2s_for_championship" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          championship_type
          eligible_country_iso2
        ],
        db_default: %w[
          id
        ],
      ),
    }.freeze,
  }.freeze

  V2_RESULTS_SANITIZERS = {
    "results" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          pos
          best
          average
        ],
        fake_values: {
          "competition_id" => "competition_id",
          "event_id" => "event_id",
          "round_type_id" => "round_type_id",
          "person_name" => "person_name",
          "person_id" => "person_id",
          "format_id" => "format_id",
          "regional_single_record" => "regional_single_record",
          "regional_average_record" => "regional_average_record",
          "person_country_id" => "country_id",
        }.freeze,
      ),
    }.freeze,
    "result_attempts" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          value
          attempt_number
          result_id
          created_at
          updated_at
        ],
      ),
    }.freeze,
    "ranks_single" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          best
        ],
        fake_values: %w[
          person_id
          event_id
          world_rank
          continent_rank
          country_rank
        ],
      ),
    }.freeze,
    "ranks_average" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          best
        ],
        fake_values: %w[
          person_id
          event_id
          world_rank
          continent_rank
          country_rank
        ],
      ),
    }.freeze,
    "round_types" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          final
          name
          rank
        ],
        fake_values: %w[
          cell_name
        ],
      ),
    }.freeze,
    "events" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          format
          name
          rank
        ],
        fake_values: {
          # Copy over column to keep backwards compatibility
          "cell_name" => "name",
        },
      ),
    }.freeze,
    "formats" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          expected_solve_count
          name
          sort_by
          sort_by_second
          trim_fastest_n
          trim_slowest_n
        ],
      ),
    }.freeze,
    "countries" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          iso2
          name
        ],
        fake_values: %w[
          continent_id
        ],
      ),
    }.freeze,
    "continents" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          latitude
          longitude
          name
          zoom
        ],
        fake_values: %w[
          record_name
        ],
      ),
    }.freeze,
    "persons" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          name
          gender
        ],
        fake_values: {
          "id" => "wca_id",
          "sub_id" => "sub_id",
          "country_id" => "country_id",
        },
      ),
    }.freeze,
    "competitions" => {
      where_clause: PUBLIC_COMPETITION_JOIN,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          name
          information
          external_website
          venue
          latitude
          longitude
        ],
        fake_values: {
          "city_name" => "city_name",
          "country_id" => "country_id",
          "venue_address" => "venue_address",
          "venue_details" => "venue_details",
          "cell_name" => "cell_name",
          "cancelled" => "(competitions.cancelled_at IS NOT NULL AND competitions.cancelled_by IS NOT NULL)",
          "event_specs" => "REPLACE(GROUP_CONCAT(DISTINCT competition_events.event_id), \",\", \" \")",
          "delegates" => "GROUP_CONCAT(DISTINCT(CONCAT(\"[{\", users_delegates.name, \"}{mailto:\", users_delegates.email, \"}]\")) SEPARATOR \" \")",
          "organizers" => "GROUP_CONCAT(DISTINCT(CONCAT(\"[{\", users_organizers.name, \"}{mailto:\", users_organizers.email, \"}]\")) SEPARATOR \" \")",
          "year" => "YEAR(start_date)",
          "month" => "MONTH(start_date)",
          "day" => "DAY(start_date)",
          "end_month" => "MONTH(end_date)",
          "end_day" => "DAY(end_date)",
        }.freeze,
      ),
      tsv_sanitizers: actions_to_column_sanitizers(
        fake_values: {
          "information" => "REGEXP_REPLACE(information, '[[:space:]]+', ' ')",
        },
      ),
    }.freeze,
    "scrambles" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          scramble
        ],
        fake_values: %w[
          id
          competition_id
          event_id
          group_id
          is_extra
          round_type_id
          scramble_num
        ],
      ),
      tsv_sanitizers: actions_to_column_sanitizers(
        fake_values: {
          "scramble" => "IF(eventId='333mbf', REPLACE(scramble, '\\n', '|'), scramble)",
        },
      ),
    }.freeze,
    "championships" => {
      where_clause: JOIN_WHERE_VISIBLE_COMP,
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          id
          competition_id
          championship_type
        ],
      ),
    }.freeze,
    "eligible_country_iso2s_for_championship" => {
      column_sanitizers: actions_to_column_sanitizers(
        copy: %w[
          championship_type
          eligible_country_iso2
        ],
        db_default: %w[
          id
        ],
      ),
    }.freeze,
  }.freeze

  RESULTS_EXPORT_VERSIONS = {
    v1: {
      metadata: {
        export_format_version: 'v1.0.0',
        version_label: 'deprecated',
        end_of_life_date: '2026-01-01',
      },
      db_config: :results_dump,
      db_sanitizers: RESULTS_SANITIZERS,
    },
    v2: {
      metadata: {
        export_format_version: 'v2.0.0',
        version_label: 'current',
        end_of_life_date: nil,
      },
      db_config: :results_dump_v2,
      db_sanitizers: V2_RESULTS_SANITIZERS,
    },
  }.freeze

  def self.results_export_live_versions
    past_eol = RESULTS_EXPORT_VERSIONS.select do |_, v|
      date = v[:metadata][:end_of_life_date]
      date && Date.parse(date) <= Date.today
    end.keys

    RESULTS_EXPORT_VERSIONS.keys - past_eol
  end

  def self.current_results_export_version
    RESULTS_EXPORT_VERSIONS.find { |_k, v| v[:metadata][:version_label] == "current" }&.first
  end

  # NOTE: The parameter dump_config_name has to correspond exactly to the desired key in config/database.yml
  def self.with_dumped_db(dump_config_name, dump_sanitizers, dump_ts_name = nil, drop_db_after_dump: true)
    primary_db_config = ActiveRecord::Base.connection_db_config

    config = ActiveRecord::Base.configurations.configs_for(name: dump_config_name.to_s, include_hidden: true)
    dump_db_name = config.configuration_hash[:database]

    LogTask.log_task "Creating temporary database '#{dump_db_name}'" do
      ActiveRecord::Tasks::DatabaseTasks.drop config
      ActiveRecord::Tasks::DatabaseTasks.create config
      ActiveRecord::Tasks::DatabaseTasks.load_schema config
    ensure
      # Need to connect to primary database again because the operations above redirect the entire ActiveRecord connection
      ActiveRecord::Base.establish_connection(primary_db_config) if primary_db_config

      # We use GROUP_CONCAT for some fields to maintain backwards compatibility with the Results Export schema.
      # Unfortunately, MySQL has an embarrassingly low default value for the max_length, so we steal the MariaDB default instead :)
      ActiveRecord::Base.connection.execute("SET SESSION group_concat_max_len = 1048576")
    end

    # We need to make sure that the dump runs in the correct order, because of foreign key dependencies.
    #   Normally, this would not be a problem for a "standard SQL dump", because tools like `mysqldump` or `mariadb-dump`
    #   simply disable Foreign Keys altogether, then dump the data in one go, and then enable the foreign key checking again.
    # However, since we're running manual dumps while foreign key checking is enabled, we need to make sure that our data
    #   is being dumped in the "correct order". For example, we cannot run the `results` dumper before `rounds`,
    #   because there is a Foreign Key pointing from the former to the latter, so inserting values into `results`
    #   without the corresponding `rounds` row already existing, will make the DB throw errors.
    ordered_table_names = dump_sanitizers.keys
                                         .index_with { ActiveRecord::Base.connection.foreign_keys(it).pluck(:to_table) }
                                         .tsort

    # Turn of foreign key checking to avoid errors when dumping data caused by foreign keys referencing not yet
    # existing rows.
    ActiveRecord::Base.connection.execute("SET foreign_key_checks=0")

    LogTask.log_task "Populating sanitized tables in '#{dump_db_name}'" do
      ordered_table_names.each do |table_name|
        table_sanitizer = dump_sanitizers[table_name]

        next if table_sanitizer == :skip_all_rows

        # Give an option to override source table name if schemas diverge
        source_table = table_sanitizer[:source_table] || table_name

        column_sanitizers = table_sanitizer[:column_sanitizers].reject do |_, column_sanitizer|
          column_sanitizer == :db_default
        end

        column_expressions = column_sanitizers.map do |column_name, column_sanitizer|
          column_sanitizer == :copy ? "#{source_table}.#{column_name}" : "#{column_sanitizer} AS #{ActiveRecord::Base.connection.quote_column_name column_name}"
        end.join(", ")

        # Some column names like "rank" are reserved keywords starting mysql 8.0 and require quoting.
        quoted_column_list = column_sanitizers.keys.map { |column_name| ActiveRecord::Base.connection.quote_column_name column_name }.join(", ")

        where_clause_sql = table_sanitizer.fetch(:where_clause, "")
        order_by_clause_sql = table_sanitizer.fetch(:order_by_clause, "")

        populate_table_sql = "INSERT INTO #{dump_db_name}.#{table_name} (#{quoted_column_list}) SELECT #{column_expressions} FROM #{source_table} #{where_clause_sql} #{order_by_clause_sql}"
        ActiveRecord::Base.connection.execute(populate_table_sql.strip)
      end

      ActiveRecord::Base.connection.execute("INSERT INTO #{dump_db_name}.server_settings (name, value, created_at, updated_at) VALUES ('#{dump_ts_name}', UNIX_TIMESTAMP(), NOW(), NOW())") if dump_ts_name.present?

      # Turn these back on. We do establish a new connection again in the ensure block, but just in case this carries over
      ActiveRecord::Base.connection.execute("SET foreign_key_checks=1")
    end

    yield dump_db_name
  ensure
    ActiveRecord::Tasks::DatabaseTasks.drop config if drop_db_after_dump

    # Need to connect to primary database again because the operations above redirect the entire ActiveRecord connection
    ActiveRecord::Base.establish_connection(primary_db_config) if primary_db_config
  end

  def self.development_dump(dump_filename)
    self.with_dumped_db(:developer_dump, DEV_SANITIZERS, DEV_TIMESTAMP_NAME, drop_db_after_dump: false) do |dump_db|
      LogTask.log_task "Running SQL dump to '#{dump_filename}'" do
        self.mysqldump(dump_db, dump_filename)
      end
    end
  end

  def self.public_results_dump(dump_filename, tsv_folder, version)
    sanitizers = RESULTS_EXPORT_VERSIONS[version][:db_sanitizers]
    dump_config = RESULTS_EXPORT_VERSIONS[version][:db_config]

    self.with_dumped_db(dump_config, sanitizers) do |dump_db|
      LogTask.log_task "Running SQL dump to '#{dump_filename}'" do
        self.mysqldump(dump_db, dump_filename)
      end

      sanitizers.each do |table_name, table_sanitizer|
        next if table_sanitizer == :skip_all_rows

        column_expressions = table_sanitizer[:column_sanitizers].map do |column_name, _|
          tsv_sanitizer = table_sanitizer.dig(:tsv_sanitizers, column_name)

          # TSV exports are generated by passing a certain command to MySQL via Bash.
          # Bash interprets the MySQL column quoting backtick (`) as command execution (comparable to $()) in a string.
          # So we have to mask them out to prevent Bash from "evaluating" column names.
          bash_quoted_column_name = ActiveRecord::Base.connection.quote_column_name(column_name).gsub('`', '\\\\`')

          tsv_sanitizer.present? ? "#{tsv_sanitizer} AS #{bash_quoted_column_name}" : "#{table_name}.#{column_name}"
        end.join(", ")

        populate_table_sql = "SELECT #{column_expressions} FROM #{table_name}"

        LogTask.log_task "Writing TSV for #{table_name}" do
          export_file = "#{tsv_folder}/WCA_export_#{table_name}.tsv"
          self.mysqldump_tsv(dump_db, populate_table_sql, export_file)
        end
      end
    end
  end

  def self.mysql_cli_creds
    config = ActiveRecord::Base.connection_db_config.configuration_hash
    "--user=#{config[:username]} --password=#{config[:password] || "''"} --port=#{config[:port]} --host=#{config[:host]} #{'--ssl-ca=/rails/rds-cert.pem' if Rails.env.production?}"
  end

  def self.mysql(command, database = nil)
    system_pipefail!("mysql #{self.mysql_cli_creds} #{database} -e '#{command}' #{filter_out_mysql_warning}")
  end

  def self.mysqldump_tsv(database, command, dest_filename)
    system_pipefail!("mysql #{self.mysql_cli_creds} #{database} --batch --quick -e \"#{command}\" #{filter_out_mysql_warning dest_filename}")
  end

  def self.mysqldump(db_name, dest_filename)
    system_pipefail!("mysqldump #{self.mysql_cli_creds} #{db_name} -r #{dest_filename} #{filter_out_mysql_warning}")
    system_pipefail!("ruby -i -pe '$_.gsub!(%r{^/\\*!50013 DEFINER.*\\n}, \"\")' #{dest_filename}")
  end

  def self.filter_out_mysql_warning(dest_filename = nil)
    "2>&1 | grep -v \"\\[Warning\\] Using a password on the command line interface can be insecure.\"#{" > #{dest_filename}" if dest_filename.present?} || true"
  end
end

# See https://julialang.org/blog/2012/03/shelling-out-sucks
def system_pipefail!(cmd)
  cmd = "set -o pipefail && #{cmd}"
  system("bash -c #{cmd.shellescape}", exception: true)
end
