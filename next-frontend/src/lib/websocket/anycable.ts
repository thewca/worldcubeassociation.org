export function anycableConnection(competitionId: string, roundId: string) {
  return {
    // This is anycables pubsub mode that doesn't require a rpc server
    channel: "$pubsub",
    stream_name: `results_${competitionId}_${roundId}`,
  };
}
