import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TitleBar from '../titleBar/TitleBarContainer';
import ScoreWheel from '../scoreWheel/ScoreWheelContainer';
import SupplyUnitsBivariateCone from '../bivariateCone/SupplyUnitsBivariateConeContainer';
import SuppliersBivariateCone from '../bivariateCone/SuppliersBivariateConeContainer';
import DynamicText from '../dynamicTexts/DynamicText';
import Map from '../map/MapContainer';
import MapList from '../mapList/MapListContainer';
import Sankey from '../sankey/SankeyContainer';
import SankeyList from '../sankeyList/SankeyListContainer';
import styles from './App.module.css';
import { DYNAMIC_TEXT } from '../constants';

class Section extends Component {
  render() {
    return <div className={this.props.className}>{this.props.children}</div>;
  }
}

Section.propTypes = {
  className: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

class App extends Component {
  render() {
    const { texts, error, goBack, refresh } = this.props;
    const {
      scoreWheelText,
      mapIntroText,
      mapText,
      sankeyIntroText,
      sankeyText
    } = texts;

    return (
      <div className={styles.App}>
        {(!error || error.type !== 'password') && <TitleBar />}
        {error ? (
          <div className={styles.errorContainer}>
            <p>{error.msg}</p>
            <button className={styles.errorBtn} onClick={error.type === 'nodata' ? goBack : refresh}>
              {error.type === 'nodata' ? 'Back' : 'Refresh'}
            </button>
          </div>
        ) : (
          <React.Fragment>
            <Section className={styles.sectionTall}>
              <div
                className={`${styles.oneHalf} ${styles.left} ${
                  styles.centered
                }`}
              >
                <div style={{ height: '40rem' }}>
                  <ScoreWheel showPillars />
                </div>
              </div>
              <div
                className={`${styles.oneHalf} ${styles.right} ${
                  styles.centered
                }`}
              >
                <DynamicText textFragments={scoreWheelText} />
              </div>
            </Section>
            <Section className={styles.sectionNarrow}>
              <DynamicText textFragments={mapIntroText} />
            </Section>
            <Section className={styles.sectionTall}>
              <div
                className={`${styles.twoThirds} ${styles.left} ${
                  styles.centered
                }`}
              >
                <Map />
              </div>
              <div
                className={`${styles.oneThird} ${styles.right} ${
                  styles.centered
                }`}
              >
                <SupplyUnitsBivariateCone />
                <DynamicText textFragments={mapText} />
                <MapList />
              </div>
            </Section>
            <Section className={styles.sectionNarrow}>
              <DynamicText textFragments={sankeyIntroText} />
            </Section>
            <Section className={styles.sectionTall}>
              <div
                className={`${styles.twoThirds} ${styles.left} ${
                  styles.centered
                } ${styles.centerInner}`}
              >
                <Sankey />
              </div>
              <div
                className={`${styles.oneThird} ${styles.right} ${
                  styles.centered
                }`}
              >
                <SuppliersBivariateCone />
                <DynamicText textFragments={sankeyText} />
                <SankeyList />
              </div>
            </Section>
          </React.Fragment>
        )}
      </div>
    );
  }
}

const textPropTypes = PropTypes.shape({
  type: PropTypes.oneOf(Object.values(DYNAMIC_TEXT)),
  id: PropTypes.string,
  values: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string
    })
  )
});

App.propTypes = {
  // Mount the app or shows message
  error: PropTypes.shape({
    type: PropTypes.string.isRequired,
    msg: PropTypes.string.isRequired,
  }),
  // Error message when it has it
  goBack: PropTypes.func.isRequired,
  refresh: PropTypes.func.isRequired,
  texts: PropTypes.shape({
    scoreWheelText: PropTypes.arrayOf(textPropTypes),
    mapIntroText: PropTypes.arrayOf(textPropTypes),
    mapText: PropTypes.arrayOf(textPropTypes),
    sankeyIntroText: PropTypes.arrayOf(textPropTypes),
    sankeyText: PropTypes.arrayOf(textPropTypes)
  }).isRequired
};

App.defaultProps = {
  error: null
};

export default App;
