# frozen_string_literal: true

class LiveResultsChannel < ApplicationCable::Channel
  def subscribed
    stream_from Live::Config.broadcast_key(params[:round_id])
  end
end
