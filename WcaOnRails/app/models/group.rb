# frozen_string_literal: true

class Group < ApplicationRecord
  enum :group_type, {
    delegate_probation: "delegate_probation",
  }
end
