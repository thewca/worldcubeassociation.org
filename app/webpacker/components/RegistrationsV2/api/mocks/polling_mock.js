import { getSingleRegistration } from '../registration/get/get_registrations';

export default async function pollingMock(
  userId,
  competitionId,
) {
  // Now that we are doing more things on Registration create we have to poll ourselves
  const registration = await getSingleRegistration(userId, competitionId);
  return {
    status: {
      competing: registration?.competing.registration_status ?? 'processing',
      payment: 'none',
    },
    queue_count: Math.round(Math.random() * 10),
  };
}
