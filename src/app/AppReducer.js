import {
  SET_FILTER,
  HIGHLIGHT_LINK,
  HIGHLIGHT_SUPPLY_UNIT,
  HIGHLIGHT_COUNTRY,
  HIGHLIGHT_SUPPLIER,
  HIGHLIGHT_BUCKETS
} from './AppActions';
import CryptoAES from 'crypto-js/aes';
import CryptoEncoderUTF8 from 'crypto-js/enc-utf8';
import { feature } from 'topojson-client';
import { data as supplychain } from '../data/supplychain.json';
import supplyUnitTopoJSON from '../map/supplyUnit.topo.json';
import countriesTopoJSON from '../map/country.su.topo.json';
import otherCountriesTopoJSON from '../map/country.other.topo.json';
import preprocessData from '../preprocess';

let correctPassword = false;

function getDataDecoded(data) {
  const KEY_STORAGE = 'supply-chain-password';
  let pass = sessionStorage.getItem(KEY_STORAGE);
  if (!pass) {
    pass = window.prompt('Data password 🙏');
  }
  if (pass) {
    try {
      var bytes  = CryptoAES.decrypt(data, pass);
      const dataDecoded = JSON.parse(bytes.toString(CryptoEncoderUTF8));
      sessionStorage.setItem(KEY_STORAGE, pass);
      correctPassword = true;
      return dataDecoded;
    } catch(e) {
      console.warn(e);
      alert('Sorry, the password was incorrect.');
      return null;
    }
  }
}



const decodedData = getDataDecoded(supplychain);
const preprocessedData = preprocessData(decodedData);


const initialState = {
  correctPassword,
  data: preprocessedData,
  currentHighlightedSupplyUnit: null,
  currentHighlightedCountry: null,
  currentHighlightedLink: null,
  currentHighlightedSuppliers: null,
  currentHighlightedBuckets: null,
  availableFilters: {
    country: [ ...preprocessedData.countries, { id: 'all', label: 'All countries' } ],
    blend: [ ...preprocessedData.blends, { id: 'all', label: '<company name>\'s' } ],
    pillar: [ ...preprocessedData.pillars, { id: 'all', label: 'All' } ]
      .map(p => ({ ...p, label: `${p.label.toLowerCase()} standards` })),
  },
  geoms: {
    otherCountries: feature(otherCountriesTopoJSON, otherCountriesTopoJSON.objects.country).features,
    countries: feature(countriesTopoJSON, countriesTopoJSON.objects.country).features,
    supplyUnits: feature(supplyUnitTopoJSON, supplyUnitTopoJSON.objects.supplyUnit).features
  }
};

export default function (state = initialState, action) {
  switch (action.type) {
    case SET_FILTER: {
      const currentFilters = { ...state.currentFilters };
      currentFilters[action.filterId] = action.value;
      return { ...state, currentFilters };
    }
    case HIGHLIGHT_SUPPLY_UNIT: {
      return { ...state, currentHighlightedSupplyUnit: action.supplyUnit };
    }
    case HIGHLIGHT_COUNTRY: {
      return { ...state, currentHighlightedCountry: action.country };
    }
    case HIGHLIGHT_LINK: {
      return { ...state, currentHighlightedLink: action.link };
    }
    case HIGHLIGHT_SUPPLIER: {
      return { ...state, currentHighlightedSuppliers: action.supplier };
    }
    case HIGHLIGHT_BUCKETS: {
      return { ...state, currentHighlightedBuckets: action.buckets };
    }
    default:
      return state;
  }
}
