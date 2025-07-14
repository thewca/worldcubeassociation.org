# frozen_string_literal: true

module CompetitionResults
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
end
