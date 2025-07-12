import { ticketTypes, ticketStakeholderRoles } from '../../lib/wca-data.js.erb';
import CompetitionResultActionerView from './TicketWorkbenches/CompetitionResultActionerView';
import CompetitionResultRequesterView from './TicketWorkbenches/CompetitionResultRequesterView';
import EditPersonActionerView from './TicketWorkbenches/EditPersonActionerView';

export default {
  [ticketTypes.edit_person]: {
    [ticketStakeholderRoles.actioner]: EditPersonActionerView,
  },
  [ticketTypes.competition_result]: {
    [ticketStakeholderRoles.actioner]: CompetitionResultActionerView,
    [ticketStakeholderRoles.requester]: CompetitionResultRequesterView,
  },
};
