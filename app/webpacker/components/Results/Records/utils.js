import { countries } from '../../../lib/wca-data.js.erb';

export function augmentResults(results, competitionsById) {
  return results.map((result) => {
    if (result === null) return null;

    const competition = competitionsById[result.competitionId];
    const country = countries.real.find((c) => c.id === result.countryId);

    return {
      result,
      competition,
      country,
      key: `${result.id}-${result.type}`,
    };
  });
}

export function augmentApiResults(data, show) {
  const { rows, competitionsById } = data;

  const isSlim = show === 'slim';
  const isSeparate = show === 'separate';

  if (isSlim || isSeparate) {
    const [slimmed, singleRows, averageRows] = rows;

    const augmentSlimmed = slimmed.map((pair) => augmentResults(pair, competitionsById));

    return [
      augmentSlimmed,
      augmentResults(singleRows, competitionsById),
      augmentResults(averageRows, competitionsById),
    ];
  }

  return augmentResults(rows, competitionsById);
}
