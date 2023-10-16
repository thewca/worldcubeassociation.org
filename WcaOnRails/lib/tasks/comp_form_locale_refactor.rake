# frozen_string_literal: true

namespace :comp_form_locales do
  desc "Read values from the old simple_form parts of the YAML and squeeze them into the new format"
  task :refactor do
    Locales::AVAILABLE.each do |l, _|
      trans = YAML.load_file("config/locales/#{l}.yml").deep_symbolize_keys

      hints = labels = nil

      comp_attr = trans.dig(l.to_sym, :activerecord, :attributes, :competition)

      if comp_attr.present?
        labels = {
          admin: {
            is_confirmed: comp_attr[:confirmed],
            is_visible: comp_attr[:showAtAll],
          },
          competition_id: comp_attr[:id],
          name: comp_attr[:name],
          short_name: comp_attr[:cellName],
          name_reason: comp_attr[:name_reason],
          venue: {
            country_id: comp_attr[:countryId],
            city_name: comp_attr[:cityName],
            name: comp_attr[:venue],
            details: comp_attr[:venueDetails],
            address: comp_attr[:venueAddress],
            coordinates: comp_attr[:coordinates],
          },
          start_date: comp_attr[:start_date],
          end_date: comp_attr[:end_date],
          information: comp_attr[:information],
          competitor_limit: {
            enabled: comp_attr[:competitor_limit_enabled],
            count: comp_attr[:competitor_limit],
            reason: comp_attr[:competitor_limit_reason],
          },
          staff: {
            staff_delegate_ids: comp_attr[:staff_delegate_ids],
            trainee_delegate_ids: comp_attr[:trainee_delegate_ids],
            organizer_ids: comp_attr[:organizer_ids],
            contact: comp_attr[:contact],
          },
          championships: comp_attr[:championships],
          website: {
            generate_website: comp_attr[:generate_website],
            external_website: comp_attr[:external_website],
            external_registration_page: comp_attr[:external_registration_page],
            uses_wca_registration: comp_attr[:use_wca_registration],
            uses_wca_live: comp_attr[:use_wca_live_for_scoretaking],
          },
          user_settings: {
            receive_registration_emails: comp_attr[:receive_registration_emails],
          },
          entry_fees: {
            currency_code: comp_attr[:currency_code],
            base_entry_fee: comp_attr[:base_entry_fee_lowest_denomination],
            on_the_spot_entry_fee: comp_attr[:on_the_spot_entry_fee_lowest_denomination],
            guest_entry_fee: comp_attr[:guests_entry_fee_lowest_denomination],
            donations_enabled: comp_attr[:enable_donations],
            refund_policy_percent: comp_attr[:refund_policy_percent],
            refund_policy_limit_date: comp_attr[:refund_policy_limit_date],
          },
          registration: {
            opening_date_time: comp_attr[:registration_open],
            closing_date_time: comp_attr[:registration_close],
            waiting_list_deadline_date: comp_attr[:waiting_list_deadline_date],
            event_change_deadline_date: comp_attr[:event_change_deadline_date],
            allow_on_the_spot: comp_attr[:on_the_spot_registration],
            allow_self_delete_after_acceptance: comp_attr[:allow_registration_self_delete_after_acceptance],
            allow_self_edits: comp_attr[:allow_registration_edits],
            guests_enabled: comp_attr[:guests_enabled],
            guest_entry_status: comp_attr[:guest_entry_status],
            guests_per_registration: comp_attr[:guests_per_registration_limit],
            extra_requirements: comp_attr[:extra_registration_requirements],
            force_comment: comp_attr[:force_comment_in_registration],
          },
          event_restrictions: {
            early_puzzle_submission: {
              enabled: comp_attr[:early_puzzle_submission],
              reason: comp_attr[:early_puzzle_submission_reason],
            },
            qualification_results: {
              enabled: comp_attr[:qualification_results],
              reason: comp_attr[:qualification_results_reason],
              allow_registration_without: comp_attr[:allow_registration_without_qualification],
            },
            event_limitation: {
              enabled: comp_attr[:event_restrictions],
              reason: comp_attr[:event_restrictions_reason],
              per_registration_limit: comp_attr[:events_per_registration_limit],
            },
            main_event_id: comp_attr[:main_event_id],
          },
          remarks: comp_attr[:remarks],
          clone_tabs: comp_attr[:clone_tabs],
        }
      end

      comp_form_hints = trans.dig(l.to_sym, :simple_form, :hints, :competition)
      comp_form_data = trans.dig(l.to_sym, :competitions, :competition_form)

      if comp_form_hints.present?
        hints = {
          admin: {
            is_confirmed: comp_form_hints[:confirmed],
            is_visible: comp_form_hints[:showAtAll],
          },
          competition_id: comp_form_hints[:id],
          name: comp_form_hints[:name],
          short_name: comp_form_hints[:cellName],
          name_reason_html: comp_form_data&.dig(:name_reason_html),
          venue: {
            country_id: comp_form_hints[:countryId],
            city_name: comp_form_hints[:cityName],
            name_html: comp_form_data&.dig(:venue_html),
            details_html: comp_form_data&.dig(:venue_details_html),
            address: comp_form_hints[:venueAddress],
            coordinates: comp_form_hints[:coordinates],
          },
          start_date: comp_form_hints[:start_date],
          end_date: comp_form_hints[:end_date],
          information: comp_form_hints[:information],
          competitor_limit: {
            enabled: comp_form_hints[:competitor_limit_enabled],
            count: comp_form_hints[:competitor_limit],
            reason: comp_form_hints[:competitor_limit_reason],
          },
          staff: {
            staff_delegate_ids: comp_form_hints[:staff_delegate_ids],
            trainee_delegate_ids: comp_form_hints[:trainee_delegate_ids],
            organizer_ids: comp_form_hints[:organizer_ids],
            contact_html: comp_form_data&.dig(:contact_html),
          },
          championships: comp_form_hints[:championships],
          website: {
            generate_website: comp_form_hints[:generate_website],
            external_website: comp_form_hints[:external_website],
            external_registration_page: comp_form_hints[:external_registration_page],
            uses_wca_registration: comp_form_hints[:use_wca_registration],
            uses_wca_live: comp_form_hints[:use_wca_live_for_scoretaking],
          },
          user_settings: {
            receive_registration_emails: comp_form_hints[:receive_registration_emails],
          },
          entry_fees: {
            currency_code: comp_form_hints[:currency_code],
            base_entry_fee: comp_form_hints[:base_entry_fee_lowest_denomination],
            on_the_spot_entry_fee: comp_form_hints[:on_the_spot_entry_fee_lowest_denomination],
            guest_entry_fee: comp_form_hints[:guests_entry_fee_lowest_denomination],
            donations_enabled: comp_form_hints[:enable_donations],
            refund_policy_percent: comp_form_hints[:refund_policy_percent],
            refund_policy_limit_date: comp_form_hints[:refund_policy_limit_date],
          },
          registration: {
            opening_date_time: comp_form_hints[:registration_open],
            closing_date_time: comp_form_hints[:registration_close],
            waiting_list_deadline_date: comp_form_hints[:waiting_list_deadline_date],
            event_change_deadline_date: comp_form_hints[:event_change_deadline_date],
            allow_on_the_spot: comp_form_hints[:on_the_spot_registration],
            allow_self_delete_after_acceptance: comp_form_hints[:allow_registration_self_delete_after_acceptance],
            allow_self_edits: comp_form_hints[:allow_registration_edits],
            guests_enabled: comp_form_hints[:guests_enabled],
            guest_entry_status: comp_form_hints[:guest_entry_status],
            guests_per_registration: comp_form_hints[:guests_per_registration_limit],
            extra_requirements: comp_form_hints[:extra_registration_requirements],
            force_comment: comp_form_hints[:force_comment_in_registration],
          },
          event_restrictions: {
            early_puzzle_submission: {
              enabled: comp_form_hints[:early_puzzle_submission],
              reason: comp_form_hints[:early_puzzle_submission_reason],
            },
            qualification_results: {
              enabled: comp_form_hints[:qualification_results],
              reason: comp_form_hints[:qualification_results_reason],
              allow_registration_without: comp_form_hints[:allow_registration_without_qualification],
            },
            event_limitation: {
              enabled: comp_form_hints[:event_restrictions],
              reason: comp_form_hints[:event_restrictions_reason],
              per_registration_limit: comp_form_hints[:events_per_registration_limit],
            },
            main_event_id: comp_form_hints[:main_event_id],
          },
          remarks: comp_form_hints[:remarks],
          clone_tabs: comp_form_hints[:clone_tabs],
        }
      end

      write_data = {
        l.to_sym => {
          competitions: {
            competition_form: {
              labels: labels&.deep_stringify_keys,
              hints: hints&.deep_stringify_keys,
            },
          },
        },
      }

      File.write("config/locales/#{l}.yml", write_data.deep_stringify_keys.to_yaml, mode: 'a')
    end
  end
end
