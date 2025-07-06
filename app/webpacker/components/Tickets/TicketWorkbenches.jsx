import { ticketTypes, ticketStakeholderRoles } from '../../lib/wca-data.js.erb';
import EditPersonActionerView from './TicketWorkbenches/EditPersonActionerView';

export default {
  [ticketTypes.edit_person]: {
    [ticketStakeholderRoles.actioner]: EditPersonActionerView,
  },
};
