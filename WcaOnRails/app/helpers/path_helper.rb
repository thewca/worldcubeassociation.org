module PathHelper
  def person_path(id)
    "/results/p.php?i=#{id}"
  end

  def event_path(id)
    "/results/e.php?i=#{id}"
  end
end
