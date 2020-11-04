import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SupplyUnitScoreWheel from './SupplyUnitScoreWheelContainer';
import DynamicText from '../dynamicTexts/DynamicText';
import { DYNAMIC_TEXT } from '../constants';
import styles from './SupplyUnitTooltip.module.css';

export class SupplyUnitTooltip extends Component {
  render() {
    const { supplyUnit, score } = this.props;
    return (
      <div className={styles.SupplyUnitTooltip}>
        <p className={styles.supplyUnitLegend}>
          <svg width="25" height="3" xmlns="http://www.w3.org/2000/svg"><path d="M1.48 1.25h24.04" fillRule="nonzero" stroke="#4C525F" strokeWidth="2.5" fill="none" strokeDasharray="2,8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Country mean
        </p>
        <SupplyUnitScoreWheel mini />
        <div className={styles.text}>
          <DynamicText textFragments={[
            {
              type: DYNAMIC_TEXT.DYNAMIC,
              value: supplyUnit.label
            },
            {
              type: DYNAMIC_TEXT.STATIC,
              value: 'accounts for'
            },
            {
              type: DYNAMIC_TEXT.DYNAMIC,
              value: `${Math.round(supplyUnit.ratioInBlend * 100)}%`
            },
            {
              type: DYNAMIC_TEXT.STATIC,
              value: 'of the blend. These'
            },
            {
              type: DYNAMIC_TEXT.DYNAMIC,
              value: supplyUnit.volume
            },
            {
              type: DYNAMIC_TEXT.STATIC,
              value: 'tons of coffee have an average score of'
            },
            {
              type: DYNAMIC_TEXT.DYNAMIC,
              value: Math.round(score * 100)
            },
            {
              type: DYNAMIC_TEXT.STATIC,
              value: '.'
            }
          ]} />
        </div>
      </div>
    );
  }
}

SupplyUnitTooltip.propTypes = {
  supplyUnit: PropTypes.shape({
    label: PropTypes.string,
    ratioInBlend: PropTypes.number.isRequired,
    volume: PropTypes.number.isRequired
  }).isRequired,
  score: PropTypes.number.isRequired
};

export default SupplyUnitTooltip;
