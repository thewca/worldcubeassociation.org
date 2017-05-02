# frozen_string_literal: true

module PersonsHelper
  def rank_td(rank_object, type)
    rank = rank_object&.public_send("#{type}_rank")
    rank = "-" if rank == 0
    content_tag :td, rank, class: "#{type}-rank #{'record' if rank == 1}"
  end

  def odd_rank_reason
    icon("question-circle", title: t("persons.show.odd_rank_reason"), data: { toggle: "tooltip" })
  end

  def odd_rank_reason_needed?(rank_single, rank_average)
    odd_rank?(rank_single) || (rank_average && odd_rank?(rank_average))
  end

  def odd_rank?(rank)
    any_missing = rank.continent_rank == 0 || rank.country_rank == 0 # Note: world rank is always present.
    any_missing || rank.continent_rank < rank.country_rank
  end
end
