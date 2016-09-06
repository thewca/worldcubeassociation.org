module DelegatesHelper
  def position(code)
    {
      'board_member' => 'Board Member',
      'candidate_delegate' => 'Candidate Delegate',
      'delegate' => 'Delegate',
      'senior_delegate' => 'Senior Delegate'
    }[code]
  end

  def delegate_class(code)
    {
      'board_member' => 'alert-success',
      'candidate_delegate' => 'alert-warning',
      'senior_delegate' => 'alert-info'
    }[code]
  end
end
