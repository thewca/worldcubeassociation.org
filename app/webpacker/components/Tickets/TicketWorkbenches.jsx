import { ticketTypes, ticketStakeholderRoles } from '../../lib/wca-data.js.erb';
import EditPersonTicketWorkbench from './TicketWorkbenches/EditPersonTicketWorkbench';

export default {
  [ticketTypes.edit_person]: {
    [ticketStakeholderRoles.actioner]: EditPersonTicketWorkbench,
  },
};
