import * as d3 from 'd3';
import { SCOREWHEEL_BUCKET_CONFIG } from './constants';

// This is fully static and thus added as a const, not needed in the source JSON
const addScoreWheelBucketConfig = inputData => ({
  scoreWheelBucketConfigs: [SCOREWHEEL_BUCKET_CONFIG],
  ...inputData
});

// Clean up supply units without parcels - this should not happen with correct data
function filterSupplyUnitsWithoutParcels(data) {
  const parcelSupplyUnits = data.parcels.map(p => p.supplyUnit.id);
  const supplyUnitsFiltered = data.supplyUnits.filter(su => parcelSupplyUnits.includes(su.id));
  return {...data, supplyUnits: supplyUnitsFiltered };
}

// Adds backreferences
const addParentIds = inputData => {
  const data = inputData;
  const relations = [
    { parents: 'pillars', parent: 'pillar', children: 'standards' },
    { parents: 'countries', parent: 'country', children: 'supplyUnits' },
  ];
  relations.forEach(relation => {
    const children = data[relation.children];
    const parents = data[relation.parents];
    children.forEach(child => {
      const parent = parents.find(p => {
        const parentChildren = p[relation.children];
        return parentChildren.find(parentChild => parentChild.id === child.id);
      });
      child[relation.parent] = parent && parent.id;
    });
  });
  return data;
};

// add blend weights to SUs, then deduct blend weight per trait
const addBlendWeights = inputData => {
  const data = inputData;

  // compute total volumes by SU
  data.parcels.forEach(parcel => {
    const supplyUnit = data.supplyUnits.find(su => su.id === parcel.supplyUnit.id) || {};
    if (supplyUnit.volume === undefined) {
      supplyUnit.volume = 0;
      supplyUnit.blendWeights = {};
    }
    if (supplyUnit.blendWeights[parcel.blend.id] === undefined) {
      supplyUnit.blendWeights[parcel.blend.id] = 0;
    }
    supplyUnit.blendWeights[parcel.blend.id] += parcel.volume;
    supplyUnit.volume += parcel.volume;
  });

  // compute blend weights using total volume
  data.supplyUnits.forEach(su => {
    if (su.blendWeights !== undefined) {
      Object.keys(su.blendWeights).forEach(blendId => {
        su.blendWeights[blendId] /= su.volume;
      });
    } else {
      console.warn(`Supply unit ${JSON.stringify(su)} doesn't have a parcel`);
    }
  });

  // add blend weights to traits
  data.traits.forEach(trait => {
    const supplyUnit = data.supplyUnits.find(su => su.id === trait.supplyUnit.id);
    trait.blendWeights = supplyUnit && supplyUnit.blendWeights;
  });

  return data;
};

// replaces null values for bucket filters by generic { id: 'all' }, for later ease of manipulation
const addGenericValuesToBucketConfigs = inputData => {
  const data = inputData;
  [data.volumeBucketConfigs, data.scoreBucketConfigs, data.scoreWheelBucketConfigs].forEach(bucketConfigs => {
    if (!bucketConfigs) {
      console.warn('bucketConfigs missing');
      return;
    }
    bucketConfigs.forEach(bucketConfig => {
      Object.keys(bucketConfig).forEach(filter => {
        if (bucketConfig[filter] === null) {
          bucketConfig[filter] = { id: 'all' };
        }
      });
    })
  });
  return data;
};

// includes country origin in parcel
const addParcelCountry = inputData => {
  const countrySupplyUnitsIDs = inputData.countries.map((country) => ({
    id: country.id,
    supplyUnits: country.supplyUnits.map(su => su.id)
  }));
  inputData.parcels = inputData.parcels.map(p => {
    const country = countrySupplyUnitsIDs.find(c => c.supplyUnits.includes(p.supplyUnit.id)) || {};
    return {
      ...p,
      country: { id: country.id }
    };
  });
  return inputData;
}

// attach TopoJSON gemoetries to SUs and Countries
// REMOVE ME
// const attachGeometries = inputData => {
//   const data = inputData;
//   data.countries = inputData.countries.map(country => {
//     const countryGeom = countriesGeom.find(cGeom => country.id.toUpperCase() === cGeom.properties.NAME.replace(/ /g,'_').toUpperCase()) || {};
//     if (!countryGeom.properties) {
//       console.warn('country', countryGeom, 'not found');
//       countryGeom.properties = {}; // DID only for avoid crashes when no geom data
//     }
//     return { ...country, ...countryGeom };
//   });

//   data.supplyUnits = inputData.supplyUnits.map(supplyUnit => {
//     const supplyUnitGeom = supplyUnitsGeom.find(suGeom => supplyUnit.id === suGeom.properties.ID) || {};
//     if (!supplyUnitGeom.properties) {
//       // console.warn('SU', supplyUnitGeom, 'not found');
//       supplyUnitGeom.properties = {}; // DID only for avoid crashes when no geom data
//     }
//     return { ...supplyUnit, ...supplyUnitGeom };
//   });
//   return data;
// };

// pregenerate D3 scales for each bucket
const createBucketScales = inputData => {
  const data = inputData;
  [data.volumeBucketConfigs, data.scoreBucketConfigs, data.scoreWheelBucketConfigs].forEach(bucketConfigs => {
    if (!bucketConfigs) {
      console.warn('bucketConfigs missing');
      return;
    }
    bucketConfigs.forEach(bucketConfig => {
      const buckets = [0, ...bucketConfig.buckets, 1];
      const scales = [];
      for (let i = 0; i < buckets.length - 1; i++) {
        // precompute scale functions for each bucket (scales are linear within a bucket, but not overall)
        scales.push(d3.scaleLinear().domain([buckets[i], buckets[i + 1]]));
      }
      bucketConfig.buckets = buckets;
      bucketConfig.scales = scales;
    });
  });
  return data;
};

const fixLabels = inputData => {
  const regex = /\.+\s*$/g;
  const replaceLabel = (i) => `"${i.replace(regex, '')}"`;
  inputData.criteria.forEach(c => {
    c.label = replaceLabel(c.label);
  });
  inputData.standards.forEach(s => {
    s.label = replaceLabel(s.label);
  });
  return inputData;
};

const addStandardsCriteria = inputData => {
  inputData.standards = inputData.standards.map(standard => {
    const standardCriterias = standard.criteria.map(c => c.id);
    const criteria = inputData.criteria.filter(c => standardCriterias.includes(c.id));
    return {
      ...standard,
      criteria
    };
  });
  return inputData;
};


const transformData = (data, transformFunctions) => {
  let transformedData = data;
  if (!data) {
    return {
      countries: [],
      blends: [],
      pillars: [],
      suppliers: [],
      supplyUnits: [],
      traits: [],
      standards: []
    };
  };

  transformFunctions.forEach(f => {
    transformedData = f(transformedData);
  });
  return transformedData;
};

const preprocessData = (data) => transformData(data, [
  addScoreWheelBucketConfig,
  filterSupplyUnitsWithoutParcels,
  addParentIds,
  addBlendWeights,
  addGenericValuesToBucketConfigs,
  addParcelCountry,
  addStandardsCriteria,
  // attachGeometries,
  createBucketScales,
  fixLabels
]);

export default preprocessData;
