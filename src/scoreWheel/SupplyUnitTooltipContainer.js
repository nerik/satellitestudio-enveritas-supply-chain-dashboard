import { connect } from 'react-redux';
import SupplyUnitTooltip from './SupplyUnitTooltip';
import { createSelector } from 'reselect';
import { sumBy } from 'lodash';
import {
  getCurrentHighlightedSupplyUnit,
  getSupplyUnits,
  getParcelsByCountryAndBlend,
  attachPillarScores
} from '../app/selectors';


export const getSupplyUnitStats = createSelector(
  [getCurrentHighlightedSupplyUnit, getSupplyUnits, getParcelsByCountryAndBlend],
  (supplyUnitId, supplyUnits, filteredParcels) => {
    const supplyUnit = supplyUnits.find(su => su.id === supplyUnitId);
    const supplyUnitsParcels = filteredParcels.filter(p => p.supplyUnit.id === supplyUnitId);
    const volume = sumBy(supplyUnitsParcels, 'volume');
    const totalVolume = sumBy(filteredParcels, 'volume');
    const ratioInBlend = volume / totalVolume;
    return {
      ratioInBlend,
      volume,
      ...supplyUnit
    };
  }
);

const mapStateToProps = (state) => ({
  supplyUnit: getSupplyUnitStats(state),
  score: attachPillarScores('supplyUnit')(state).overallScore
});

export default connect(mapStateToProps)(SupplyUnitTooltip);
