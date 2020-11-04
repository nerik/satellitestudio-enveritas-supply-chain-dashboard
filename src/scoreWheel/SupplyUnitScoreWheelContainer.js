import { connect } from 'react-redux';
import ScoreWheel from './ScoreWheel';
import { attachPillarScores } from '../app/selectors';

const mapStateToProps = state => {
  const data = attachPillarScores('supplyUnit')(state);
  data.countryStandardsScores = attachPillarScores('overall')(state).standardsScores;
  return { data };
};

export default connect(mapStateToProps)(ScoreWheel);
