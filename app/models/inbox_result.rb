# frozen_string_literal: true

class InboxResult < ApplicationRecord
  include Resultable

  # see result.rb for explanation of the scope
  belongs_to :inbox_person, primary_key: %i[id competition_id], foreign_key: %i[person_id competition_id], optional: true

  alias_method :person, :inbox_person

  def person_name
    inbox_person&.name || "<person_id=#{person_id}>"
  end
end
