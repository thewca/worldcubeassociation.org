module DelegatesHelper
  def delegate_class(code)
    {
      'board_member' => 'alert-success',
      'candidate_delegate' => 'alert-warning',
      'senior_delegate' => 'alert-info'
    }[code]
  end
end
