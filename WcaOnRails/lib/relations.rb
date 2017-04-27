# frozen_string_literal: true

module Relations
  def self.competitions_together(person1, person2)
    Competition.find(person1.competition_ids & person2.competition_ids)
  end

  def self.compute_linkings
    DbHelper.execute_sql File.read(Rails.root.join('lib', 'compute_linkings.sql'))
  end

  def self.get_chain(root_wca_id, other_wca_id)
    left_tree = { degrees: { root_wca_id => 0 }, current_degree: 0 }
    right_tree = { degrees: { other_wca_id => 0 }, current_degree: 0 }

    wca_id_linking_trees = calculate_degrees_and_find_wca_id_linking_trees! left_tree, right_tree
    return [] unless wca_id_linking_trees # Return an empty array if there is no realtion.
    left_chain = build_chain root_wca_id, wca_id_linking_trees, left_tree[:degrees]
    right_chain = build_chain other_wca_id, wca_id_linking_trees, right_tree[:degrees]
    (left_chain + right_chain.reverse!).uniq!
  end

  # rubocop:disable Style/For

  def self.calculate_degrees_and_find_wca_id_linking_trees!(first_tree, second_tree)
    degrees_copy = first_tree[:degrees].clone
    for wca_id, degree in degrees_copy # We need a copy as we add new keys during the iteration.
      next if degree != first_tree[:current_degree] # Continue for the outermost people in the tree.
      for related_wca_id in Linking.find(wca_id).wca_ids.shuffle
        next if first_tree[:degrees].key? related_wca_id
        first_tree[:degrees][related_wca_id] = first_tree[:current_degree] + 1
        return related_wca_id if second_tree[:degrees].key? related_wca_id # If both trees include the WCA ID, we are done.
      end
    end
    return nil if first_tree[:degrees] == degrees_copy # If none new WCA ID was added, there's no relation to search for.
    first_tree[:current_degree] += 1
    calculate_degrees_and_find_wca_id_linking_trees! second_tree, first_tree # For optimisation reasons we expand the trees (left, right) one by one.
  end

  def self.build_chain(root_wca_id, wca_id, degrees)
    return [root_wca_id] if wca_id == root_wca_id

    for related_wca_id in Linking.find(wca_id).wca_ids.shuffle
      if degrees[related_wca_id] == degrees[wca_id] - 1
        return build_chain(root_wca_id, related_wca_id, degrees) + [wca_id]
      end
    end
  end
  # rubocop:enable Style/For
end
