# frozen_string_literal: true

require "fileutils"

class DelegateInfo < ApplicationRecord
  self.table_name = "delegates"
end
