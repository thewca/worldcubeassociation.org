import { getRegistrationByUser } from '../registration/get/get_registrations';

export default async function pollingMock(
  userId,
  competitionId,
) {
  // Now that we are doing more things on Registration create we have to poll ourselves
  const registration = await getRegistrationByUser(userId, competitionId);

  return {
    processing: !registration,
    queue_count: Math.round(Math.random() * 10),
  };
}
