# frozen_string_literal: true

module CompetitionResultsImport
  def self.import_temporary_results(competition, temporary_results_data, mark_result_submitted: false, store_uploaded_json: false, results_json_str: nil)
    errors = []
    results_to_import = temporary_results_data[:results_to_import]
    scrambles_to_import = temporary_results_data[:scrambles_to_import]
    persons_to_import = temporary_results_data[:persons_to_import]

    ActiveRecord::Base.transaction do
      InboxPerson.where(competition_id: competition.id).delete_all
      InboxResult.where(competition_id: competition.id).delete_all
      Scramble.where(competition_id: competition.id).delete_all
      InboxPerson.import!(persons_to_import)
      Scramble.import!(scrambles_to_import)
      InboxResult.import!(results_to_import)

      competition.touch(:results_submitted_at) if mark_result_submitted && !competition.results_submitted?

      competition.uploaded_jsons.create!(json_str: results_json_str) if store_uploaded_json
    rescue ActiveRecord::RecordNotUnique
      errors << "Duplicate record found while uploading results. Maybe there is a duplicate personId in the JSON?"
    rescue ActiveRecord::RecordInvalid => e
      object = e.record
      errors << if object.instance_of?(Scramble)
                  "Scramble in '#{Round.name_from_attributes_id(object.event_id, object.round_type_id)}' is invalid (#{e.message}), please fix it!"
                elsif object.instance_of?(InboxPerson)
                  "Person #{object.name} is invalid (#{e.message}), please fix it!"
                elsif object.instance_of?(InboxResult)
                  "Result for person #{object.person_id} in '#{Round.name_from_attributes_id(object.event_id, object.round_type_id)}' is invalid (#{e.message}), please fix it!"
                else
                  "An invalid record prevented the results from being created: #{e.message}"
                end
    end

    errors
  end

  def self.merge_inbox_results(competition)
    ActiveRecord::Base.transaction do
      result_data = competition.inbox_results
                               .includes(:inbox_person)
                               .map do |inbox_res|
                                 inbox_person = inbox_res.inbox_person

                                 person_id = inbox_person&.wca_id.presence || inbox_res.person_id
                                 person_country = inbox_person&.country

                                 {
                                   pos: inbox_res.pos,
                                   person_id: person_id,
                                   person_name: inbox_res.person_name,
                                   country_id: person_country.id,
                                   competition_id: inbox_res.competition_id,
                                   event_id: inbox_res.event_id,
                                   round_type_id: inbox_res.round_type_id,
                                   round_id: inbox_res.round_id,
                                   format_id: inbox_res.format_id,
                                   # We keep writing to the valueN columns here as an exception,
                                   # because the bulk import through `insert_all` below does not trigger model hooks
                                   value1: inbox_res.value1,
                                   value2: inbox_res.value2,
                                   value3: inbox_res.value3,
                                   value4: inbox_res.value4,
                                   value5: inbox_res.value5,
                                   best: inbox_res.best,
                                   average: inbox_res.average,
                                   attempt_values: inbox_res.attempts,
                                 }
      end

      result_rows = result_data.map { it.with_indifferent_access.slice(*Result.attribute_names) }
      Result.insert_all!(result_rows)

      # Idea: Every result is unique by the (round_id, person_id) tuple.
      #   So even before inserting into the DB, we can uniquely identify which attempts belong to which result.
      result_attempts_index = result_data.to_h { [[it[:round_id], it[:person_id]], it[:attempt_values]] }
      # Then we insert next, which generates IDs through the AUTO-INCREMENT key.
      #   But the properties round_id and person_id are still the same as before, so we use them as a lookup.
      attempt_rows = competition.reload.results.flat_map { Result.unpack_attempt_attributes(result_attempts_index[[it.round_id, it.person_id]], result_id: it.id) }
      ResultAttempt.insert_all!(attempt_rows)

      competition.inbox_results.destroy_all
    end
  end

  def self.post_results_error(comp)
    return I18n.t('competitions.messages.computing_auxiliary_data') if ComputeAuxiliaryData.in_progress?

    return I18n.t('competitions.messages.no_results') unless comp.results.any?

    return I18n.t('competitions.messages.no_main_event_results', event_name: comp.main_event.name) if comp.main_event && comp.results.where(event_id: comp.main_event_id).empty?

    I18n.t('competitions.messages.results_already_posted') if comp.results_posted?
  end

  def self.post_results(comp, current_user)
    ActiveRecord::Base.transaction do
      # It's important to clearout the 'posting_by' here to make sure
      # another WRT member can start posting other results.
      comp.update!(results_posted_at: Time.now, results_posted_by: current_user.id, posting_by: nil)
      comp.competitor_users.each { |user| user.notify_of_results_posted(comp) }
      comp.registrations.accepted.each { |registration| registration.user.maybe_assign_wca_id_by_results(comp) }
      comp.tickets_competition_result.presence&.update!(status: TicketsCompetitionResult.statuses[:posted])
    end
  end
end
