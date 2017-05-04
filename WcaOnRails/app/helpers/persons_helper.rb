# frozen_string_literal: true

module PersonsHelper
  IN_MEMORIAM = {
    "2008COUR01" => "/forum/viewtopic.php?t=2028",
    "2003LARS01" => "/forum/viewtopic.php?t=1982",
    "2012GALA02" => "/forum/viewtopic.php?t=1044",
    "2008LIMR01" => "/forum/viewtopic.php?t=945",
    "2008KIRC01" => "/forum/viewtopic.php?t=470",
  }.freeze

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
