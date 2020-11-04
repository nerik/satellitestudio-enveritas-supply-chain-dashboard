import { mean, meanBy, sumBy, uniqBy } from 'lodash';
import * as d3 from 'd3';

const collectForSupplyUnit = (collection, supplyUnitID) => {
  const itemsForSupplyUnit = collection.filter(item =>
    item.supplyUnit.id === supplyUnitID
  );
  return itemsForSupplyUnit;
};

export const collectTraitsForSupplyUnit = (allTraits, supplyUnitID) => {
  const traitsForSupplyUnit = collectForSupplyUnit(allTraits, supplyUnitID);
  if (!traitsForSupplyUnit.length) {
    console.warn('no traits found for SU', supplyUnitID);
  }
  return traitsForSupplyUnit;
};

export const collectParcelsForSupplyUnit = (allParcels, supplyUnitID) => {
  const parcelsForSupplyUnit = collectForSupplyUnit(allParcels, supplyUnitID);
  if (!parcelsForSupplyUnit.length) {
    console.warn('no parcels found for SU', supplyUnitID);
  }
  return parcelsForSupplyUnit;
};

export const resolveSupplyUnitScores = (standards, allTraits, supplyUnitsForCountry, currentBlend) => {
  const supplyUnitsWithScores = supplyUnitsForCountry.map(supplyUnit => {
    const supplyUnitTraits = collectTraitsForSupplyUnit(allTraits, supplyUnit.id);
    let pillarScores = null;
    if (supplyUnitTraits.length) {
      const supplyUnitScores = computeScoresByStandard(standards, supplyUnitTraits, currentBlend);
      pillarScores = computePillarScores(supplyUnitScores);
    } else {
      console.warn('supply unit without traits', supplyUnit);
    }
    return {
      ...supplyUnit, // TODO: check when pillarScores is undefined
      value: (pillarScores && pillarScores.overallScore) || 0
    };
  });
  return supplyUnitsWithScores;
};


// For each standard, compute the score based on a list of filtered traits (filtered by country or SU) and
// the blend currently selected. If a blend is selected, a weighted mean is made for each criterion, otherwise
// a simple mean. The means for each criteria then gets averaged again to get a result for a standard.
export const computeScoresByStandard = (standards, filteredTraits, currentBlend) => {
  const standardsScores = standards.map(standard => {
    const allStandardCriteriaScores = standard.criteria.map(criterion => {
      let criterionScore = null;
      const criterionTraits = filteredTraits
        .filter(trait => trait.criterion.id === criterion.id);

      if (!criterionTraits.length) return criterionScore;

      if (currentBlend === 'all') {
        criterionScore = meanBy(criterionTraits, 'score');
      }

      // take blend weights into account
      if (!criterionScore) {
        const criterionTotalWeights = sumBy(criterionTraits, ct => (ct.blendWeights && ct.blendWeights[currentBlend]) || 0);
        const criterionCumulatedScores = sumBy(criterionTraits, ct => {
          if (!ct.blendWeights || !ct.blendWeights[currentBlend]) {
            return null;
          }
          return ct.blendWeights[currentBlend] * ct.score;
        });
        criterionScore = criterionCumulatedScores / criterionTotalWeights;
      }
      if (criterionScore < 0) {
        console.warn(`Criterion ${criterion.label} score is negative`, criterionScore);
        return null;
      }

      return criterionScore;
    }).filter(s => s);

    const standardScore = !!allStandardCriteriaScores.length
      ? mean(allStandardCriteriaScores)
      : null;

    return {
      ...standard,
      value: standardScore
    };
  });
  return standardsScores;
};

// Adds pillar and overal score means based on standard scores
export const computePillarScores = (standardsScores) => {
  const pillars = uniqBy(standardsScores, s => s.pillar).map(s => s.pillar);
  const pillarsScores = {};
  pillars.forEach(pillar => {
    const pillarStandards = standardsScores.filter(s => s.pillar === pillar);

    let pillarScore = 0;
    if (!pillarStandards.length) {
      console.warn('error calculating pillar means as no standards have been found for', pillar);
    } else {
      pillarScore = meanBy(pillarStandards, 'value');
    }

    pillarsScores[pillar] = pillarScore;
  });

  const overallScore = meanBy(standardsScores, 'value');

  return {
    standardsScores,
    pillarsScores,
    overallScore
  };
};

export const computeVolume = (parcels) => {
  return sumBy(parcels, parcel => parcel.volume);
};

// Takes a set of current filter to decide which bucket config applies
export const resolveBucketConfig = (bucketConfigs, currentCountry, currentBlend, currentPillar = null) => {
  if (!bucketConfigs) return null;
  return (
    bucketConfigs.find(b => b.country.id === currentCountry && b.blend.id === currentBlend && b.pillar && b.pillar.id === currentPillar) ||
    bucketConfigs.find(b => b.country.id === currentCountry && b.blend.id === currentBlend) ||
    bucketConfigs.find(b => b.country.id === currentCountry) || console.warn('Bucket config not defined, getting first as fallback') ||
    bucketConfigs[0]
  );
};

// for each valueObject in the passed dataset a bucket index as well as the "local" value
// inside the bucket (ie if value is .6 and bucket is .4 -> .8, local value is .5)
// maxValue is needed to calculate local values when max is not 1 (as in score) but a dynamic value (in volumes)
// key is needed when we need to resolve buckets for example in volumes ('volume' instead of 'value')
export const resolveBuckets = (valueObjects, bucketConfig, maxValue = null, key = 'value') => {
  if (!bucketConfig) return null;

  // Reset max value. This is used for volume scales where end value is dynamic (max volume)
  if (maxValue !== null) {
    const buckets = [...bucketConfig.buckets];
    const scales = [...bucketConfig.scales];
    buckets[buckets.length - 1] = maxValue;
    scales[scales.length - 1] = d3.scaleLinear().domain([buckets[buckets.length - 2], maxValue]);
    bucketConfig = {...bucketConfig, buckets, scales};
  }
  const resolvedValues = valueObjects.map(valueObject => {
    for (let b = 1; b < bucketConfig.buckets.length; b++) {
      if (valueObject[key] <= bucketConfig.buckets[b]) {
        const bucketIndex = b - 1;
        const localBucketValue = bucketConfig.scales[bucketIndex](valueObject[key]);
        return {
          bucketIndex,
          localBucketValue,
          bucketConfig,
          ...valueObject
        };
      }
    }
    return {};
  });
  return resolvedValues;
};
