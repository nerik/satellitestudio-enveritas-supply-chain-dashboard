import { createSelector } from 'reselect';
import {
  defaultFilters,
  getSortScoresBy,
  getSupplierScoreOrder,
  getStandards,
  getTraitsByCurrentCountryAndPillar,
  getCurrentBlend,
  getCurrentPillar,
  getCountries,
  getSupplyUnits,
  getCurrentSuppliersWithScore,
  getParcelsByCountryAndBlend,
  getCurrentMMRFlagTraits,
  getNotMMRTraits,
  getCurrentCountryData,
  attachPillarScores,
  getIsCountrySelected,
  getCountriesWithVolume,
  collectSupplyUnitsForCurrentCountryAndBlend,
} from './selectors';
import { computeScoresByStandard } from './filters';
import { uniq, mean, maxBy, meanBy, sumBy, orderBy } from 'lodash';
import { DYNAMIC_TEXT } from '../constants';

const scoreWheelTextsConfig = [
  { type: DYNAMIC_TEXT.MENU, id: 'blend' },
  { type: DYNAMIC_TEXT.STATIC, value: 'coffee comes from' },
  { type: DYNAMIC_TEXT.MENU, id: 'country' },
  { type: DYNAMIC_TEXT.STATIC, value: 'and has an average score of' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'avgStandardScore' },
  { type: DYNAMIC_TEXT.STATIC, value: 'with' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'percentageOfMeeting' },
  { type: DYNAMIC_TEXT.STATIC, value: '% of farmers meeting all minimum requirements.' },
  { type: DYNAMIC_TEXT.BREAK },
  { type: DYNAMIC_TEXT.STATIC, value: 'The' },
  { type: DYNAMIC_TEXT.MENU,
    id: 'sortScoresBy',
    values: [
      { id: 'desc', label: 'best score' },
      { id: 'asc', label: 'worst score' },
    ]
  },
  { type: DYNAMIC_TEXT.STATIC, value: 'of' },
  { type: DYNAMIC_TEXT.MENU, id: 'pillar' },
  { type: DYNAMIC_TEXT.STATIC, value: 'comes from' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'selectedIndicatorByScore' },
  { type: DYNAMIC_TEXT.STATIC, value: '.' },
];

const introMapTextsConfig = [
  { type: DYNAMIC_TEXT.STATIC, value: 'This coffee comes from ' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'totalSupplyUnits' },
  { type: DYNAMIC_TEXT.STATIC, value: ' supply units in ' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'numberOfCountries' },
  { type: DYNAMIC_TEXT.STATIC, value: 'countries. ' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'biggestCountry' },
  { type: DYNAMIC_TEXT.STATIC, value: ' alone accounts for' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'biggestCountryPercentage' },
  { type: DYNAMIC_TEXT.STATIC, value: '% of purchases and has an average score of ' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'biggestCountryScore' },
  { type: DYNAMIC_TEXT.STATIC, value: '.' },
];

const introMapTextsCountrySelectedConfig = [
  { type: DYNAMIC_TEXT.STATIC, value: 'This coffee coming out of' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'selectedCountry' },
  { type: DYNAMIC_TEXT.STATIC, value: 'is sourced from' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'totalSupplyUnitsByCountry' },
  { type: DYNAMIC_TEXT.STATIC, value: 'supply units. ' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'biggestSupplyUnit' },
  { type: DYNAMIC_TEXT.STATIC, value: 'alone accounts for more than' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'biggestSupplyUnitPercentage' },
  { type: DYNAMIC_TEXT.STATIC, value: '%.' },
  { type: DYNAMIC_TEXT.BREAK },
  { type: DYNAMIC_TEXT.STATIC, value: 'Farmers in ' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'mostMissedMMRSupplyUnit' },
  { type: DYNAMIC_TEXT.STATIC, value: ' missed the most minimum requirements.' },
];

const mapTextsConfig = [
  { type: DYNAMIC_TEXT.STATIC, value: 'Countries by purchased volume' }
];

const mapTextsCountrySelectedConfig = [
  { type: DYNAMIC_TEXT.STATIC, value: 'Supply units in' },
  { type: DYNAMIC_TEXT.MENU,
    id: 'country'
  },
  { type: DYNAMIC_TEXT.STATIC, value: ' by' },
  { type: DYNAMIC_TEXT.MENU,
    id: 'mapDimension',
    values: [
      { id: 'bivariate', label: 'volume and score' },
      { id: 'volume', label: 'volume' },
      { id: 'score', label: 'score' },
    ]
  },
];

const sankeyIntroTextsConfig = [
  { type: DYNAMIC_TEXT.STATIC, value: 'The coffee is supplied by' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'numOfSuppliers' },
  { type: DYNAMIC_TEXT.STATIC, value: 'suppliers. ' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'biggestSupplier' },
  { type: DYNAMIC_TEXT.STATIC, value: 'alone accounts for more than ' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'biggestSupplierPercentage' },
  { type: DYNAMIC_TEXT.STATIC, value: '% of the blend. ' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'numOfSuppliersMeeting' },
  { type: DYNAMIC_TEXT.STATIC, value: ' suppliers source from at least one area that doesn\'t meet the minimum requirements.' },
  { type: DYNAMIC_TEXT.BREAK },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'supplierByScore' },
  { type: DYNAMIC_TEXT.STATIC, value: 'has' },
  { type: DYNAMIC_TEXT.MENU,
    id: 'supplierScoreOrder',
    values: [
      { id: 'desc', label: 'the highest score' },
      { id: 'asc', label: 'the lowest score' },
    ],
  },
  { type: DYNAMIC_TEXT.STATIC, value: ', sourcing from' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'supplyUnitsNumber' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'supplyUnitsLabel' },
  { type: DYNAMIC_TEXT.STATIC, value: 'with an average score of ' },
  { type: DYNAMIC_TEXT.DYNAMIC, id: 'supplierSelectedScore' },
  { type: DYNAMIC_TEXT.STATIC, value: '.' },
];

const sankeyTextsConfig = [
  { type: DYNAMIC_TEXT.STATIC, value: 'Suppliers in' },
  { type: DYNAMIC_TEXT.MENU,
    id: 'country'
  },
  { type: DYNAMIC_TEXT.STATIC, value: ' by' },
  { type: DYNAMIC_TEXT.MENU,
    id: 'sankeyDimension',
    values: [
      { id: 'bivariate', label: 'volume and score' },
      { id: 'volume', label: 'volume' },
      { id: 'score', label: 'score' },
    ]
  }
];

const fillDynamicTexts = (texts, dictionary) => {
  if (!texts && !texts.length) return;
  return texts.map(text => {
    if (text.type !== DYNAMIC_TEXT.DYNAMIC) return text;
    return ({
      ...text,
      value: dictionary[text.id]
    });
  });
};

const textsConfig = {
  scoreWheelTextsConfig,
  introMapTextsConfig,
  introMapTextsCountrySelectedConfig,
  mapTextsConfig,
  mapTextsCountrySelectedConfig,
  sankeyIntroTextsConfig,
  sankeyTextsConfig
};

const getTotals = createSelector(
  [getSupplyUnits, getCountries, getCurrentSuppliersWithScore],
  (supplyUnits, countries, suppliers) => ({
    countries: countries.length,
    supplyUnits: supplyUnits.length,
    suppliers: suppliers.length
  }
));

// For a given set of SUs, calculates the % of missed criterias
const getSupplyUnitsMinimumRequirements = createSelector(
  [
    collectSupplyUnitsForCurrentCountryAndBlend,
    getCurrentMMRFlagTraits,
  ],
  (supplyUnits, flagTraitsFilteredByMMR) => {
    const supplyUnitsMinRatio = supplyUnits.map(su => {
      const flagTrait = flagTraitsFilteredByMMR.find(f => f.supplyUnit.id === su.id) || {};
      if (flagTrait.ratio === undefined) {
        console.warn('SU is missing an mmr flagTrait', su.id);
      }
      return flagTrait.ratio || 0;
    });
    const matchingSupplyUnitsMean = mean(supplyUnitsMinRatio);

    const mostMissedSUIDs = orderBy(flagTraitsFilteredByMMR, 'score', 'asc').filter((su, i) => i < 3).map(su => su.supplyUnit.id);
    const mostMissedSUs = mostMissedSUIDs.map(suid => supplyUnits.find(s => s.id === suid));
    let mostMissedSUsLabel;

    if (mostMissedSUs && mostMissedSUs.length) {
      const missedSus = mostMissedSUs.slice(0, 3);
      mostMissedSUsLabel = missedSus.reduce((acc, next, index) => (
        `${acc}${next.label}${index === mostMissedSUs.length - 2 ? ' and ' : index < mostMissedSUs.length - 1 ? ', ' : ''}`
      ), '');
    }

    return {
      percentage: Math.round(matchingSupplyUnitsMean * 100),
      mostMissedSUs: mostMissedSUsLabel
    };
  }
);

const getSuppliersTexts = createSelector(
  [
    getParcelsByCountryAndBlend,
    getCurrentSuppliersWithScore,
    getNotMMRTraits,
    getSupplierScoreOrder
  ],
  (
    parcels,
    suppliers,
    traits,
    supplierScoreOrder
  ) => {
    const supplyUnitsNotMeeting = uniq(traits.map(t => t.supplyUnit.id));
    const parcelsNotMeeting = parcels.filter(p => supplyUnitsNotMeeting.includes(p.supplyUnit.id));
    const suppliersNotMeeting = uniq(parcelsNotMeeting.map(p => p.supplier.id));

    const selectedSupplier = suppliers && suppliers.length > 0
      ? orderBy(suppliers, 'value', supplierScoreOrder)[0]
      : {};
    const supplyUnitsNumber = selectedSupplier.supplyUnits && selectedSupplier.supplyUnits.length;
    const supplyUnitsLabel = `supply unit${supplyUnitsNumber > 1 ? 's' : ''}`;

    return {
      notMeeting: suppliersNotMeeting.length,
      selectedByScore: selectedSupplier.label,
      supplyUnitsLabel,
      supplyUnitsNumber,
      score: Math.round(selectedSupplier.value * 100)
    };
});

const getBiggests = createSelector(
  [getStandards, getTraitsByCurrentCountryAndPillar, getCountriesWithVolume, getCurrentBlend, getCurrentSuppliersWithScore],
  (standards, traits, countryWithVolumes, blend, suppliers) => {
  const biggestCountry = maxBy(countryWithVolumes, 'volume');
  const totalVolume = sumBy(countryWithVolumes, 'volume');

  const supplyUnitIDsForCountry = biggestCountry.supplyUnits.map(su => su.id);
  const traitsForCountry = traits.filter(trait =>
    supplyUnitIDsForCountry.includes(trait.supplyUnit.id)
  );
  const biggestCountryScores = computeScoresByStandard(standards, traitsForCountry, blend);
  const biggestCountryScore = meanBy(biggestCountryScores, 'value');

  const biggestSupplier = maxBy(suppliers, 'volume') || {};
  const totalSuppliers = sumBy(suppliers, 'volume');
  return {
    country: biggestCountry.label,
    percentage: Math.round(biggestCountry.volume / totalVolume * 100),
    score: Math.round(biggestCountryScore * 100),
    supplier: biggestSupplier.label,
    supplierPercentage: Math.floor(biggestSupplier.volume / totalSuppliers * 100)
  };
});

const getBiggestsByCountry = createSelector(
  [collectSupplyUnitsForCurrentCountryAndBlend],
  (supplyUnits) => {
    const biggestSupplyUnit = supplyUnits.length > 0
      ? maxBy(supplyUnits, 'volume')
      : {};
    const totalSupplyUnits = sumBy(supplyUnits, 'volume');
    return {
      totalSupplyUnitsByCountry: supplyUnits.length,
      supplyUnit: biggestSupplyUnit.label,
      supplyUnitPercentage: Math.round(biggestSupplyUnit.volume / totalSupplyUnits * 100)
    };
});

const getScoreStandard = createSelector(
  [getSortScoresBy, getCurrentPillar, attachPillarScores('overall')],
  (sortScoresBy, pillar, scores) => {
    let filteredScores = scores.standardsScores.filter(s => s.value !== null);
    if (pillar !== defaultFilters.pillar) {
      filteredScores = scores.standardsScores.filter(s => s.pillar === pillar);
    }
    const scoreStandardIndicator = orderBy(filteredScores, 'value', sortScoresBy)[0];
    return {
      overallScore: scores.overallScore,
      indicator: scoreStandardIndicator
    };
  }
);

const getDynamicTextsDictionary = createSelector(
    [
      getCurrentCountryData,
      getTotals,
      getBiggests,
      getBiggestsByCountry,
      getSupplyUnitsMinimumRequirements,
      getSuppliersTexts,
      getScoreStandard,
    ],
    (
      country,
      totals,
      biggests,
      biggestsByCountry,
      minimumRequiremments,
      suppliers,
      scoreStandard,
    ) => {
      return {
        avgStandardScore: Math.round(scoreStandard.overallScore * 100),
        percentageOfMeeting: minimumRequiremments.percentage,
        selectedIndicatorByScore: scoreStandard.indicator && scoreStandard.indicator.label,
        totalSupplyUnits: totals.supplyUnits,
        numberOfCountries: totals.countries,
        biggestCountry: biggests.country,
        biggestCountryPercentage: biggests.percentage,
        mostMissedMMRSupplyUnit: minimumRequiremments.mostMissedSUs,
        biggestCountryScore: biggests.score,
        selectedCountry: country && country.label,
        totalSupplyUnitsByCountry: biggestsByCountry.totalSupplyUnitsByCountry,
        biggestSupplyUnit: biggestsByCountry.supplyUnit,
        biggestSupplyUnitPercentage: biggestsByCountry.supplyUnitPercentage,
        biggestSupplier: biggests.supplier,
        biggestSupplierPercentage: biggests.supplierPercentage,
        numOfSuppliers: totals.suppliers,
        numOfSuppliersMeeting: suppliers.notMeeting,
        supplierByScore: suppliers.selectedByScore,
        supplyUnitsLabel: suppliers.supplyUnitsLabel,
        supplyUnitsNumber: suppliers.supplyUnitsNumber,
        supplierSelectedScore: suppliers.score
      };
    }
);

const getDynamicTextsFilled = createSelector(
  [getDynamicTextsDictionary], (dictionary) =>
    Object.keys(textsConfig).reduce((acc, key) => ({
      ...acc,
      [key]: fillDynamicTexts(textsConfig[key], dictionary)
    }), {})
);

export const getDynamicTexts = createSelector(
  [getIsCountrySelected, getDynamicTextsFilled],
  (isCountrySelected, texts) => ({
    scoreWheelText: texts.scoreWheelTextsConfig,
    mapIntroText: isCountrySelected ? texts.introMapTextsConfig : texts.introMapTextsCountrySelectedConfig,
    mapText: isCountrySelected ? texts.mapTextsConfig : texts.mapTextsCountrySelectedConfig,
    sankeyIntroText: texts.sankeyIntroTextsConfig,
    sankeyText: texts.sankeyTextsConfig
  })
);
