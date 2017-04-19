# frozen_string_literal: true

module Relations
  def self.get_chain(wca_id1, wca_id2)
    find_chain([[wca_id1]], [[wca_id2]])
  end

  def self.competitions_together(wca_id1, wca_id2)
    PeoplePairWithCompetition.includes(:competition).where(wca_id1: wca_id1, wca_id2: wca_id2).map(&:competition)
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
      linkings[chain.last].map { |wca_id| [*chain, wca_id] }
    end.flatten!(1)
  end

  def self.random_final_chain(left_chains, right_chains)
    for *left_chain, left_last in left_chains.shuffle
      for *right_chain, right_last in right_chains.shuffle
        return [*left_chain, left_last, *right_chain.reverse] if left_last == right_last
      end
    end
    nil
  end

  def self.linkings
    @@linkings ||= ActiveRecord::Base.connection.execute("SELECT wca_id, wca_ids FROM linkings")
                                     .to_a.map! { |wca_id, wca_ids| [wca_id, wca_ids.split(',')] }
                                     .to_h.freeze
  end

  def self.compute_auxiliary_data
    sql = File.read(Rails.root.join('lib', 'relations_compute_auxiliary_data.sql'))
    sql.split(';').each do |statement|
      ActiveRecord::Base.connection.execute statement if statement.present?
    end
    @@linkings = nil
  end
end
