# frozen_string_literal: true

module PersonsHelper
  def rank_td(rank_object, type)
    rank = rank_object&.public_send("#{type}_rank")
    content_tag :td, rank, class: "#{type}-rank #{'record' if rank == 1}"
  end
end
