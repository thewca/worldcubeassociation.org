// eslint-disable-next-line import/prefer-default-export
export const updateTicketMetadata = (oldTicketDetails, fieldName, newData) => ({
  ...oldTicketDetails,
  ticket: {
    ...oldTicketDetails.ticket,
    metadata: {
      ...oldTicketDetails.ticket.metadata,
      [fieldName]: newData,
    },
  },
});
