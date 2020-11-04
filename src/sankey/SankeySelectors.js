import { sumBy, groupBy, orderBy, mean } from 'lodash';
import { createSelector, createStructuredSelector } from 'reselect';
import { resolveBuckets } from '../app/filters';
import { matchesWithHighlightedBuckets } from '../utils';
import {
  computeSupplyUnitScoresForCurrentSelection,
  getCurrentHighlightedBucket,
  getCurrentHighlightedLink,
  getCurrentHighlightedSuppliers,
  getCurrentHighlightedSupplyUnit,
  getParcelsByCountryAndBlend,
  resolveScoreBucketConfigs,
  resolveVolumeBucketConfigs,
  getDimensionMode,
  getSupplyUnits,
  computeSuppliersWithScoreAndVolume,
  computeParcelsVolume
} from '../app/selectors';
import { MODES } from '../bivariateCone/BivariateCone';
import { OTHERS_ID, BUCKETS, BUCKETS_BY_SCORE, BUCKETS_BY_INDEX, BUCKETS_BY_VOLUME } from '../constants';

const computeSupplyUnitsVolumeRatios = createSelector(
  [computeSupplyUnitScoresForCurrentSelection, getParcelsByCountryAndBlend, computeParcelsVolume],
  (supplyUnitsWithScores, parcels, totalVolume) => {
    const allSupplyUnitParcels = parcels.map(p => ({
      id: p.supplyUnit.id,
      volume: p.volume
    }));
    // multiple parcels can have the same supply unit, so merge them
    const supplyUnitsGroupedById = groupBy(allSupplyUnitParcels, 'id');
    // for each supply unit, calculate the volume proportion of the SU compared to the volume total
    // this is used by the sankey
    const supplyUnits = Object.keys(supplyUnitsGroupedById).map((id) => ({
      id,
      volume: sumBy(supplyUnitsGroupedById[id], 'volume') / totalVolume
    }));

    // match computed SU volumes with previously computed SU scores
    return supplyUnits.map(su => {
      // TODO: "Jutiapa-Jalapa-BajaVerapaz" doesn't apper in the list, double check if data or wtf
      const supplyUnitScore = supplyUnitsWithScores.find(sus => sus.id === su.id) || {};
      return {
        ...su,
        label: supplyUnitScore.label,
        value: supplyUnitScore.value || 0
      };
    });
});

const computeSupplyUnitsBuckets = createSelector(
  [computeSupplyUnitsVolumeRatios, resolveScoreBucketConfigs],
  resolveBuckets
);

export const groupSupplyUnitsByBucket = createSelector(
  [computeSupplyUnitsBuckets],
  (supplyUnitsWithScore) => {
  const groupedByBucket = groupBy(supplyUnitsWithScore, 'bucketIndex');
  const supplyUnits = Object.keys(groupedByBucket).map(key => ({
    id: key,
    value: mean(groupedByBucket[key].map(su => su.value)),
    volume: sumBy(groupedByBucket[key], 'volume'),
    supplyUnits: groupedByBucket[key].map(su => ({id: su.id, label: su.label })),
    bucket: BUCKETS_BY_SCORE[key]
  }));
  return orderBy(supplyUnits, 'id', 'desc');
});

export const computeSuppliersOthersGrouped = createSelector(
  [computeSuppliersWithScoreAndVolume],
  (suppliers) => {
    const [top10Suppliers, otherSuppliers] = [suppliers.slice(0, 10), suppliers.slice(10)];
    if (!otherSuppliers.length) return top10Suppliers;

    const others = {
      id: OTHERS_ID,
      suppliersIds: otherSuppliers.map(su => su.id),
      value: mean(otherSuppliers.map(s => s.value)), // needed to not crash in the resolveBuckets
      volume: otherSuppliers.reduce((acc, su) => acc + su.volume, 0)
    };
    return top10Suppliers.concat(others);
});

const resolveSuppliersScoreBuckets = createSelector(
  [computeSuppliersOthersGrouped, resolveScoreBucketConfigs, computeParcelsVolume],
  (suppliers, config, max) => {
    return resolveBuckets(suppliers, config, max);
  }
);

const resolveSuppliersVolumeBuckets = createSelector(
  [computeSuppliersOthersGrouped, resolveVolumeBucketConfigs, computeParcelsVolume],
  (suppliers, config, max) => {
    return resolveBuckets(suppliers, config, max, 'volumeAbs');
  }
);

export const computeSuppliersBuckets = createSelector(
  [resolveSuppliersScoreBuckets, resolveSuppliersVolumeBuckets, getDimensionMode],
  (suppliersScoreBucket, supplierVolumeBucket, dimensionMode) => {
    return suppliersScoreBucket.map(su => {
      if (su.id === OTHERS_ID) {
        return { ...su, bucket: BUCKETS.NA };
      }
      const volumeBucket = supplierVolumeBucket.find(s => s.id === su.id);
      if (!volumeBucket || volumeBucket.bucketIndex === null) return su;
      let bucket = BUCKETS_BY_INDEX[volumeBucket.bucketIndex][su.bucketIndex];
      if (dimensionMode === MODES.score) {
        bucket = BUCKETS_BY_SCORE[su.bucketIndex];
      } else if (dimensionMode === MODES.volume) {
        bucket = BUCKETS_BY_VOLUME[volumeBucket.bucketIndex];
      }
      return {
        ...su,
        bucket,
        bucketIndexes: {
          volume: volumeBucket.bucketIndex,
          score: su.bucketIndex
        }
      };
    });
  }
);

export const computeLinks = createSelector(
  [
    getParcelsByCountryAndBlend,
    computeParcelsVolume,
    getSupplyUnits,
    groupSupplyUnitsByBucket,
    computeSuppliersOthersGrouped
  ],
  ( parcels,
    totalVolume,
    supplyUnits,
    supplyUnitGroups,
    suppliers
  ) => {
    // Generate uniq ids for supplyUnit and suppliers to merge by blend when all blends selected
    const otherSuppliers = suppliers.find(s => s.id === OTHERS_ID) ;
    const parcelIds = parcels.map(p => {
      const isOtherSupplier = otherSuppliers && otherSuppliers.suppliersIds.includes(p.supplier.id);
      return {
        ...p,
        id: `${p.supplyUnit.id}-${isOtherSupplier ? OTHERS_ID : p.supplier.id}`
      };
    });
    const groupedParcels = groupBy(parcelIds, 'id');
    const links = Object.keys(groupedParcels).map(key => {
      const parcelsGroup = groupedParcels[key];

      const supplyUnitId = parcelsGroup[0].supplyUnit.id;
      const supplyUnit = supplyUnits.find(su => su.id  === supplyUnitId);
      const supplyUnitGroup = supplyUnitGroups.find(g => g.supplyUnits.map(s => s.id).includes(supplyUnitId));

      const supplierId = parcelsGroup[0].supplier.id;
      const isOtherSupplier = otherSuppliers && otherSuppliers.suppliersIds.includes(supplierId);

      const value = sumBy(parcelsGroup, 'volume') / totalVolume;
      const nodeLeftId = supplyUnitGroup.id;
      const nodeRightId = isOtherSupplier ? OTHERS_ID : supplierId;
      return {
        id: `${nodeLeftId}-${supplyUnit.label}-${nodeRightId}`,
        nodeLeft: {
          id: nodeLeftId,
          label: supplyUnit && supplyUnit.label
        },
        nodeRight: {
          id: nodeRightId,
          label: supplierId,
          supplier: supplierId
        },
        value
      };
    });
    return links.sort((a, b) => b[2] - a[2]);
});

export const getCurrentHighlights = createStructuredSelector({
  buckets: getCurrentHighlightedBucket,
  link: getCurrentHighlightedLink,
  supplier: getCurrentHighlightedSuppliers,
  supplyUnit: getCurrentHighlightedSupplyUnit,
});

export const hasCurrentHighlights = createSelector(
  getCurrentHighlights,
  (currentHighlights) => {
    return Object.values(currentHighlights).filter(h => h !== null && h.length > 0).length > 0;
});

export const computeNodesHighlight = (nodeType) => {
  const nodeGetter = nodeType === 'supplyUnits'
    ? groupSupplyUnitsByBucket
    : computeSuppliersBuckets;
  return createSelector(
    [nodeGetter, computeLinks, getCurrentHighlights, hasCurrentHighlights],
    (nodes, links, currentHighlights, hasCurrentHighlight) => {
      if (!hasCurrentHighlight) return nodes.map(node => ({...node, opacity: 1 }));

      const isSupplierHighlighted = currentHighlights.supplier !== null && currentHighlights.supplier.length > 0;
      const isSupplyUnitHighlighted = currentHighlights.supplyUnit !== null;
      const isLinkHighlighted = currentHighlights.link !== null;
      let activeLinks;
      if (isSupplierHighlighted) {
        // Needs to check also nodeRight supplier when currentHighlights.supplier belongs to other id
        activeLinks = links.filter(l =>
          currentHighlights.supplier.includes(l.nodeRight.id) ||
          currentHighlights.supplier.includes(l.nodeRight.supplier)
        );
      } else if (isSupplyUnitHighlighted) {
        activeLinks = links.filter(l => l.nodeLeft.id === currentHighlights.supplyUnit);
      } else if (isLinkHighlighted) {
        activeLinks = links.filter(l => l.id === currentHighlights.link);
      }

      return nodes.map(node => {
        let isHighlighted;
        if (isSupplierHighlighted || isSupplyUnitHighlighted || isLinkHighlighted) {
          // Needs to check also nodeRight supplier when currentHighlights.supplier belongs to other id
          isHighlighted = activeLinks.some(link => (node.id === link.nodeLeft.id || node.id === link.nodeRight.id || node.id === link.nodeRight.supplier));
        } else {
          isHighlighted = matchesWithHighlightedBuckets(node.bucketIndexes, currentHighlights.buckets);
        }
        return { ...node, opacity: isHighlighted ? 1 : 0.1 };
      });
  });
};

export const computeLinksHighlight = createSelector(
  [computeLinks, getCurrentHighlights, hasCurrentHighlights],
  (links, currentHighlights, hasCurrentHighlight) => {
    return links.map(link => {
      if (!hasCurrentHighlight) return ({...link, opacity: 0.5 });

      const isLinkHighlighted = currentHighlights.link === link.id;
      const isSupplyUnitHighlighted = currentHighlights.supplyUnit && currentHighlights.supplyUnit === link.nodeLeft.id;
      const isSupplierHighlighted =
        currentHighlights.supplier &&
        (currentHighlights.supplier.includes(link.nodeRight.id) ||
        (link.nodeRight.id === OTHERS_ID && currentHighlights.supplier.includes(link.nodeRight.supplier)));
      const isHighlighted = [isLinkHighlighted, isSupplyUnitHighlighted, isSupplierHighlighted].includes(true);
      return { ...link, opacity: isHighlighted ? 1 : 0.1 };
    });
});

export const getSankeyData = createStructuredSelector({
  nodesLeft: computeNodesHighlight('supplyUnits'),
  nodesRight: computeNodesHighlight('suppliers'),
  links: computeLinksHighlight
});

export const sankeyMapStateToProps = createStructuredSelector({
  data: getSankeyData,
  totalVolume: computeParcelsVolume,
  currentHighlights: getCurrentHighlights
});
