class DelegateReportsController < ApplicationController
  before_action :authenticate_user!

  before_action -> { redirect_unless_user(:can_view_delegate_reports?) }, only: [
    :show,
  ]
  before_action -> { redirect_unless_user(:can_edit_competition_report?, competition_from_params) }, only: [
    :edit,
    :update,
  ]

  private def competition_from_params
    if params[:competition_id]
      competition = Competition.find(params[:competition_id])
    else
      report = DelegateReport.find(params[:id])
      competition = report.competition
    end
    competition
  end

  def show
    @competition = competition_from_params
    @delegate_report = @competition.delegate_report
  end

  def edit
    @competition = competition_from_params
    @delegate_report = @competition.delegate_report
  end

  def update
    @competition = competition_from_params
    @delegate_report = @competition.delegate_report
    if @delegate_report.update_attributes(delegate_report_params)
      flash[:success] = "Updated report"
      if @delegate_report.posted?
        redirect_to competition_report_path(@competition)
      else
        redirect_to competition_report_edit_path(@competition)
      end
    else
      flash.now[:danger] = "Could not update the report!"
      render :edit
    end
  end

  private def delegate_report_params
    params.require(:delegate_report).permit(:content, :posted)
  end
end
