# frozen_string_literal: true

class TraineeDelegateRecommendation < ApplicationRecord
  belongs_to :application, class_name: "TraineeDelegateApplication", inverse_of: :recommendations
  belongs_to :user
end
