import { countries } from '../../../lib/wca-data.js.erb';

export function augmentResults(results, competitionsById) {
  return results.map((result) => {
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
    return data.map((resultGroup) => augmentResults(resultGroup, competitionsById));
  }

  return augmentResults(rows, competitionsById);
}
