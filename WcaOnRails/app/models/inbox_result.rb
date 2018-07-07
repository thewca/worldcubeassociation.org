# frozen_string_literal: true

class InboxResult < ApplicationRecord
  include Resultable

  self.table_name = "InboxResults"

  #belongs_to :inbox_person, foreign_key: :personId
end
