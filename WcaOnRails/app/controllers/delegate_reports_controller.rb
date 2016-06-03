class DelegateReportsController < ApplicationController
  before_action :authenticate_user!

  private def competition_from_params
    if params[:competition_id]
      Competition.find(params[:competition_id])
    else
      DelegateReport.find(params[:id]).competition
    end
  end

  def show
    @competition = competition_from_params
    return if redirect_unless_user(:can_view_delegate_report?, @competition.delegate_report)

    @delegate_report = @competition.delegate_report
  end

  def edit
    @competition = competition_from_params
    return if redirect_unless_user(:can_edit_delegate_report?, @competition.delegate_report)

    @delegate_report = @competition.delegate_report
  end

  def update
    @competition = competition_from_params
    return if redirect_unless_user(:can_edit_delegate_report?, @competition.delegate_report)

    @delegate_report = @competition.delegate_report
    @delegate_report.current_user = current_user
    was_posted = @delegate_report.posted?
    if @delegate_report.update_attributes(delegate_report_params)
      flash[:success] = "Updated report"
      if @delegate_report.posted? && !was_posted
        CompetitionsMailer.notify_of_delegate_report_submission(@competition).deliver_later
        flash[:info] = "Your report has been posted!"
        redirect_to delegate_report_path(@competition)
      else
        redirect_to delegate_report_edit_path(@competition)
      end
    else
      render :edit
    end
  end

  private def delegate_report_params
    params.require(:delegate_report).permit(
      :discussion_url,
      :schedule_url,
      :equipment,
      :venue,
      :organisation,
      :incidents,
      :remarks,
      :posted,
    )
  end
end
