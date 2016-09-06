module DelegatesHelper
  def position(code)
    {
      'board_member' => 'Board Member',
      'candidate_delegate' => 'Candidate Delegate',
      'delegate' => 'Delegate',
      'senior_delegate' => 'Senior Delegate'
    }[code]
  end
end
