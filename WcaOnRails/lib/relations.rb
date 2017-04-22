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
      linkings(chain.last).map { |wca_id| [*chain, wca_id] }
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

  def self.linkings(wca_id)
    ActiveRecord::Base.connection.execute("SELECT wca_ids FROM linkings WHERE wca_id = '#{wca_id}'").first[0].split(',')
  end

  def self.compute_auxiliary_data
    table_exists = ActiveRecord::Base.connection.execute("SHOW TABLES LIKE 'linkings'").to_a.present?
    if table_exists
      DbHelper.execute_sql File.read(Rails.root.join('lib', 'relations_update_auxiliary_data.sql'))
    else
      DbHelper.execute_sql File.read(Rails.root.join('lib', 'relations_compute_auxiliary_data.sql'))
    end
  end
end
