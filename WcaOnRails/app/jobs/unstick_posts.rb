# frozen_string_literal: true

class UnstickPosts < ApplicationJob
  include SingletonApplicationJob

  queue_as :default

  def perform
    Post.where("unstick_at <= ?", Date.today).update_all(sticky: false, unstick_at: nil)
  end
end
