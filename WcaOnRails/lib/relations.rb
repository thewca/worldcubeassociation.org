# frozen_string_literal: true

module Relations
  def self.get_chain(wca_id1, wca_id2)
    find_chain([[wca_id1]], [[wca_id2]])
  end

  def self.competitions_together(person1, person2)
    Competition.find(person1.competition_ids & person2.competition_ids)
  end

  # Internal

  def self.find_chain(left_chains, right_chains)
    extended_chains_by_one_degree!(left_chains)
    final_chain = random_final_chain(left_chains, right_chains)
    return final_chain if final_chain
    extended_chains_by_one_degree!(right_chains)
    final_chain = random_final_chain(left_chains, right_chains)
    return final_chain if final_chain
    find_chain(left_chains, right_chains)
  end

  def self.extended_chains_by_one_degree!(chains)
    chains.map! do |chain|
      Linking.find(chain.last).wca_ids.map { |wca_id| [*chain, wca_id] }
    end.flatten!(1)
  end

  def self.random_final_chain(left_chains, right_chains)
    # rubocop:disable Style/For
    for *left_chain, left_last in left_chains.shuffle
      for *right_chain, right_last in right_chains.shuffle
        return [*left_chain, left_last, *right_chain.reverse] if left_last == right_last
      end
    end
    # rubocop:enable Style/For
    nil
  end

  def self.compute_linkings
    DbHelper.execute_sql File.read(Rails.root.join('lib', 'compute_linkings.sql'))
  end
end
