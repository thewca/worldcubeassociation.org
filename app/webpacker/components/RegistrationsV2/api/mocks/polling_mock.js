import { getSingleRegistration } from '../registration/get/get_registrations';

export default async function pollingMock(
  userId,
  competition,
) {
  // Now that we are doing more things on Registration create we have to poll ourselves
  const registration = await getSingleRegistration(userId, competition);

  if (competition.registration_version === 'v2') {
    return {
      status: {
        competing: registration?.competing.registration_status ?? 'processing',
      },
      queue_count: Math.round(Math.random() * 10),
    };
  }
  return {
    processing: !registration,
    queue_count: Math.round(Math.random() * 10),
  };
}
