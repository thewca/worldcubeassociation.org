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

  def self.merge_temporary_results(competition)
    ActiveRecord::Base.transaction do
      result_rows = competition.inbox_results
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
          value1: inbox_res.value1,
          value2: inbox_res.value2,
          value3: inbox_res.value3,
          value4: inbox_res.value4,
          value5: inbox_res.value5,
          best: inbox_res.best,
          average: inbox_res.average,
        }
      end

      Result.insert_all!(result_rows)
      competition.inbox_results.destroy_all
    end
  end
end
