import { connect } from 'react-redux';
import ScoreWheel from './ScoreWheel';
import { attachPillarScores, getCurrentPillar } from '../app/selectors';

const mapStateToProps = state => ({
  data: attachPillarScores('overall')(state),
  currentPillar: getCurrentPillar(state)
});

export default connect(mapStateToProps)(ScoreWheel);
