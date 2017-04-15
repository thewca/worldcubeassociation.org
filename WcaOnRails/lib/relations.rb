LINKINGS = ActiveRecord::Base.connection.execute("SELECT wca_id, wca_ids FROM concise_linkings")
          .to_a.map! { |wca_id, wca_ids| [wca_id, wca_ids.split(',')] }
          .to_h.freeze

module Relations
  def self.get_chain(wca_id_1, wca_id_2)
    wca_ids_chain = find_chain([[wca_id_1]], [[wca_id_2]])
    Person.where(wca_id: wca_ids_chain).sort_by { |person| wca_ids_chain.find_index person.wca_id }
  end

  def self.competitions_together(first, second)
    sql = <<-SQL
      SELECT competition.id, competition.name
      FROM people_pairs_with_competition
      JOIN Competitions competition ON competition.id = competition_id
      WHERE 1
        AND wca_id_1 = '#{first}'
        AND wca_id_2 = '#{second}'
    SQL
    ActiveRecord::Base.connection.execute(sql).to_a
  end

  def self.extended_chains_by_one_degree!(chains)
    chains.map! do |chain|
      LINKINGS[chain.last].map { |wca_id| [*chain, wca_id] }
    end.flatten!(1)
  end

  def self.random_linked_chain(left_chains, right_chains)
    for *left_chain, left_last in left_chains.shuffle
      for *right_chain, right_last in right_chains.shuffle
        return [*left_chain, left_last, *right_chain.reverse] if left_last == right_last
      end
    end
    return nil
  end

  def self.find_chain(left_chains, right_chains)
    extended_chains_by_one_degree!(left_chains)
    final_chain = random_linked_chain(left_chains, right_chains)
    return final_chain if final_chain
    extended_chains_by_one_degree!(right_chains)
    final_chain = random_linked_chain(left_chains, right_chains)
    return final_chain if final_chain
    find_chain(left_chains, right_chains)
  end
end
