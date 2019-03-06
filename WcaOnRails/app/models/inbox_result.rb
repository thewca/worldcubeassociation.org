# frozen_string_literal: true

class InboxResult < ApplicationRecord
  include Resultable

  self.table_name = "InboxResults"
end
