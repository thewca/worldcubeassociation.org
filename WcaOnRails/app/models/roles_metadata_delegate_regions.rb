# frozen_string_literal: true

class RolesMetadataDelegateRegions < ApplicationRecord
  enum :status, {
    senior_delegate: "senior_delegate",
    regional_delegate: "regional_delegate",
    delegate: "delegate",
    junior_delegate: "candidate_delegate",
    trainee_delegate: "trainee_delegate",
  }
end
