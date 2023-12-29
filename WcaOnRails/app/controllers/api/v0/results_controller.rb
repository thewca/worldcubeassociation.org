# frozen_string_literal: true

class Api::V0::ResultsController < Api::V0::ApiController
  def personal_records
    user = User.find_by_id(params[:user_id])

    return render json: { single: [], average: [] } unless user.wca_id.present?
    person = Person.includes(:ranksSingle, :ranksAverage).find_by_wca_id!(user.wca_id)

    render json: {
      single: create_simple_records_hash(person.ranksSingle),
      average: create_simple_records_hash(person.ranksAverage),
    }
  end

  private

    def create_simple_records_hash(personal_records)
      indexed_records = personal_records.index_by { |record| record['eventId'] }
      indexed_records.transform_values { |record| record.attributes.except('id', 'personId', 'eventId') }
    end
end
