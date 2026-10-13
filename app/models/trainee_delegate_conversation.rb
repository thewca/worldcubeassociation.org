# frozen_string_literal: true

class TraineeDelegateConversation < ApplicationRecord
  belongs_to :application, class_name: "TraineeDelegateApplication", inverse_of: :conversations
  belongs_to :user
end
